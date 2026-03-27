package api

import (
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/valter-silva-au/gummy-bots/server/internal/agent"
	"github.com/valter-silva-au/gummy-bots/server/internal/store"
)

const version = "0.1.0"

func NewRouter(db *store.DB, hub *Hub, bedrock *agent.BedrockClient) http.Handler {
	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "http://localhost:8081", "http://localhost:5173", "http://localhost:19006"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	h := &Handler{db: db, hub: hub, bedrock: bedrock}

	r.Get("/api/health", h.Health)
	r.Get("/ws", h.WebSocket)

	r.Route("/api/users", func(r chi.Router) {
		r.Post("/", h.CreateUser)
		r.Get("/{id}", h.GetUser)
	})

	r.Route("/api/tasks", func(r chi.Router) {
		r.Post("/", h.CreateTask)
		r.Get("/user/{userId}", h.GetTasksByUser)
	})

	r.Route("/api/gummies", func(r chi.Router) {
		r.Post("/", h.CreateGummy)
		r.Get("/active", h.GetActiveGummies)
		r.Post("/{id}/execute", h.ExecuteGummy)
	})

	r.Route("/api/agent", func(r chi.Router) {
		r.Post("/triage", h.AgentTriage)
		r.Post("/execute", h.AgentExecute)
	})

	return r
}

type Handler struct {
	db      *store.DB
	hub     *Hub
	bedrock *agent.BedrockClient
}

func (h *Handler) Health(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{
		"status":  "ok",
		"version": version,
	})
}

func (h *Handler) CreateUser(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Username string `json:"username"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}
	if req.Username == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "username required"})
		return
	}

	user, err := h.db.CreateUser(req.Username)
	if err != nil {
		slog.Error("create user failed", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to create user"})
		return
	}
	writeJSON(w, http.StatusCreated, user)
}

func (h *Handler) GetUser(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(chi.URLParam(r, "id"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid user id"})
		return
	}

	user, err := h.db.GetUser(id)
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "user not found"})
		return
	}
	writeJSON(w, http.StatusOK, user)
}

func (h *Handler) CreateTask(w http.ResponseWriter, r *http.Request) {
	var task store.Task
	if err := json.NewDecoder(r.Body).Decode(&task); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}
	if task.Title == "" || task.UserID == 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "title and userId required"})
		return
	}
	if task.Status == "" {
		task.Status = "pending"
	}
	if task.Category == "" {
		task.Category = "info"
	}

	if err := h.db.CreateTask(&task); err != nil {
		slog.Error("create task failed", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to create task"})
		return
	}
	writeJSON(w, http.StatusCreated, task)
}

func (h *Handler) GetTasksByUser(w http.ResponseWriter, r *http.Request) {
	userID, err := parseID(chi.URLParam(r, "userId"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid user id"})
		return
	}

	tasks, err := h.db.GetTasksByUser(userID)
	if err != nil {
		slog.Error("get tasks failed", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to get tasks"})
		return
	}
	if tasks == nil {
		tasks = []store.Task{}
	}
	writeJSON(w, http.StatusOK, tasks)
}

func (h *Handler) CreateGummy(w http.ResponseWriter, r *http.Request) {
	var gummy store.Gummy
	if err := json.NewDecoder(r.Body).Decode(&gummy); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}

	if err := h.db.CreateGummy(&gummy); err != nil {
		slog.Error("create gummy failed", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to create gummy"})
		return
	}

	h.hub.Broadcast(WSMessage{Type: "gummy:new", Payload: gummy})
	writeJSON(w, http.StatusCreated, gummy)
}

func (h *Handler) GetActiveGummies(w http.ResponseWriter, r *http.Request) {
	gummies, err := h.db.GetActiveGummies()
	if err != nil {
		slog.Error("get gummies failed", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to get gummies"})
		return
	}
	if gummies == nil {
		gummies = []store.Gummy{}
	}
	writeJSON(w, http.StatusOK, gummies)
}

func (h *Handler) AgentTriage(w http.ResponseWriter, r *http.Request) {
	if !h.bedrock.IsConfigured() {
		writeJSON(w, http.StatusServiceUnavailable, map[string]string{
			"error": "LLM not configured — set AWS_BEARER_TOKEN_BEDROCK",
		})
		return
	}

	var req agent.TriageRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}
	if req.TaskTitle == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "taskTitle required"})
		return
	}

	result, err := h.bedrock.Triage(req)
	if err != nil {
		slog.Error("triage failed", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *Handler) AgentExecute(w http.ResponseWriter, r *http.Request) {
	if !h.bedrock.IsConfigured() {
		writeJSON(w, http.StatusServiceUnavailable, map[string]string{
			"error": "LLM not configured — set AWS_BEARER_TOKEN_BEDROCK",
		})
		return
	}

	var req agent.ExecuteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}
	if req.TaskTitle == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "taskTitle required"})
		return
	}

	result, err := h.bedrock.Execute(req)
	if err != nil {
		slog.Error("agent execute failed", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}

	h.hub.Broadcast(WSMessage{Type: "agent:completed", Payload: result})
	writeJSON(w, http.StatusOK, result)
}

func (h *Handler) ExecuteGummy(w http.ResponseWriter, r *http.Request) {
	id, err := parseID(chi.URLParam(r, "id"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid gummy id"})
		return
	}

	if err := h.db.UpdateGummyStatus(id, "executed"); err != nil {
		slog.Error("execute gummy failed", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to execute gummy"})
		return
	}

	h.hub.Broadcast(WSMessage{Type: "gummy:executed", Payload: map[string]int64{"id": id}})
	writeJSON(w, http.StatusOK, map[string]string{"status": "executed"})
}

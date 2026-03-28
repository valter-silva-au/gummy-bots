package api

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/valter-silva-au/gummy-bots/server/internal/agent"
	"github.com/valter-silva-au/gummy-bots/server/internal/physics"
	"github.com/valter-silva-au/gummy-bots/server/internal/store"
)

const version = "0.1.0"

func maxBodySize(maxBytes int64) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			r.Body = http.MaxBytesReader(w, r.Body, maxBytes)
			next.ServeHTTP(w, r)
		})
	}
}

func optionalAPIKey(next http.Handler) http.Handler {
	apiKey := os.Getenv("GUMMY_API_KEY")
	if apiKey == "" {
		return next // No auth in local dev
	}
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Skip auth for health check
		if r.URL.Path == "/api/health" {
			next.ServeHTTP(w, r)
			return
		}
		auth := r.Header.Get("Authorization")
		if auth != "Bearer "+apiKey {
			writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "unauthorized"})
			return
		}
		next.ServeHTTP(w, r)
	})
}

func NewRouter(db *store.DB, hub *Hub, bedrock *agent.BedrockClient) http.Handler {
	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Recoverer)
	r.Use(requestTimer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "http://localhost:8081", "http://localhost:5173", "http://localhost:19006"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           300,
	}))
	r.Use(maxBodySize(1 << 20)) // 1MB request body limit

	h := &Handler{db: db, hub: hub, bedrock: bedrock, combo: physics.NewComboTracker()}

	r.Get("/api/health", h.Health)
	r.Get("/ws", h.WebSocket)

	// Apply API key auth to all /api/* routes (except health check, handled in middleware)
	r.Group(func(r chi.Router) {
		r.Use(optionalAPIKey)

	r.Route("/api/users", func(r chi.Router) {
		r.Post("/", h.CreateUser)
		r.Get("/{id}", h.GetUser)
		r.Get("/{id}/stats", h.GetUserStats)
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

	r.Route("/api/achievements", func(r chi.Router) {
		r.Get("/definitions", h.GetAchievementDefs)
		r.Get("/user/{userId}", h.GetUserAchievements)
	})

	r.Route("/api/agent", func(r chi.Router) {
		r.Post("/triage", h.AgentTriage)
		r.Post("/execute", h.AgentExecute)
	})
	})

	return r
}

type Handler struct {
	db      *store.DB
	hub     *Hub
	bedrock *agent.BedrockClient
	combo   *physics.ComboTracker
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

func (h *Handler) GetUserStats(w http.ResponseWriter, r *http.Request) {
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

	level := physics.LevelForXP(user.XP)
	progress := physics.XPProgress(user.XP, level)
	nextLevelXP := physics.XPForNextLevel(level)

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"xp":          user.XP,
		"level":       level,
		"progress":    progress,
		"nextLevelXP": nextLevelXP,
		"streakDays":  user.StreakDays,
		"streakDate":  user.StreakLastDate,
	})
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

	if task.Complexity == 0 {
		task.Complexity = 1
	}
	if task.Priority == 0 {
		task.Priority = 5
	}

	if err := h.db.CreateTask(&task); err != nil {
		slog.Error("create task failed", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to create task"})
		return
	}

	// Auto-generate gummy from task
	gummy := physics.GenerateGummy(&task)
	if err := h.db.CreateGummy(gummy); err != nil {
		slog.Error("auto-create gummy failed", "error", err)
	} else {
		// Broadcast new gummy with task label
		h.hub.Broadcast(WSMessage{Type: "gummy:new", Payload: map[string]interface{}{
			"id":          gummy.ID,
			"taskId":      gummy.TaskID,
			"color":       gummy.Color,
			"size":        gummy.Size,
			"orbitRadius": gummy.OrbitRadius,
			"orbitSpeed":  gummy.OrbitSpeed,
			"label":       task.Title,
			"category":    task.Category,
		}})
	}

	writeJSON(w, http.StatusCreated, map[string]interface{}{
		"task":  task,
		"gummy": gummy,
	})
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

	if gummy.TaskID <= 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "taskId must be positive"})
		return
	}
	if gummy.Size < 0.5 || gummy.Size > 3.0 {
		gummy.Size = 1.0 // Default
	}
	if gummy.OrbitRadius < 80 || gummy.OrbitRadius > 250 {
		gummy.OrbitRadius = 150.0 // Default
	}
	if gummy.OrbitSpeed < 3000 || gummy.OrbitSpeed > 20000 {
		gummy.OrbitSpeed = 10000.0 // Default
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
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "triage processing failed"})
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
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "agent processing failed"})
		return
	}

	h.hub.Broadcast(WSMessage{Type: "agent:completed", Payload: result})
	writeJSON(w, http.StatusOK, result)
}

func (h *Handler) GetAchievementDefs(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, physics.AllAchievements)
}

func (h *Handler) GetUserAchievements(w http.ResponseWriter, r *http.Request) {
	userID, err := parseID(chi.URLParam(r, "userId"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid user id"})
		return
	}

	achievements, err := h.db.GetAchievements(userID)
	if err != nil {
		slog.Error("get achievements failed", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "failed to get achievements"})
		return
	}

	// Enrich with definitions
	type enriched struct {
		ID          string `json:"id"`
		Name        string `json:"name"`
		Description string `json:"description"`
		Icon        string `json:"icon"`
		UnlockedAt  string `json:"unlockedAt"`
	}

	var result []enriched
	for _, a := range achievements {
		def := physics.AchievementDefByID(a.Name)
		if def != nil {
			result = append(result, enriched{
				ID:          def.ID,
				Name:        def.Name,
				Description: def.Description,
				Icon:        def.Icon,
				UnlockedAt:  a.UnlockedAt,
			})
		}
	}
	if result == nil {
		result = []enriched{}
	}
	writeJSON(w, http.StatusOK, result)
}

func (h *Handler) checkAchievements(userID int64, xpGained int, comboCount int, comboMultiplier float64, level int, streakDays int) {
	already, err := h.db.GetAchievementSet(userID)
	if err != nil {
		slog.Error("get achievement set failed", "error", err)
		return
	}

	executedCount, err := h.db.CountExecutedGummies()
	if err != nil {
		slog.Error("count executed gummies failed", "error", err)
	}
	activeCount, err := h.db.CountActiveGummies()
	if err != nil {
		slog.Error("count active gummies failed", "error", err)
	}

	ctx := physics.CheckContext{
		TotalExecutions: executedCount,
		ComboCount:      comboCount,
		XPGained:        xpGained,
		Level:           level,
		StreakDays:       streakDays,
		ActiveGummies:   activeCount,
		ComboMultiplier: comboMultiplier,
	}

	unlocked := physics.CheckAchievements(ctx, already)
	for _, achID := range unlocked {
		if err := h.db.CreateAchievement(userID, achID); err != nil {
			slog.Error("create achievement failed", "achievement", achID, "error", err)
			continue
		}
		def := physics.AchievementDefByID(achID)
		if def != nil {
			h.hub.Broadcast(WSMessage{Type: "achievement:unlocked", Payload: map[string]interface{}{
				"id":          def.ID,
				"name":        def.Name,
				"description": def.Description,
				"icon":        def.Icon,
			}})
			slog.Info("achievement unlocked", "user", userID, "achievement", achID)
		}
	}
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

	// Award XP
	comboCount := h.combo.Record()
	xpGained := physics.CalculateXP(1, comboCount)
	comboMultiplier := physics.ComboMultiplier(comboCount)

	// Update user 1 (default user for now)
	user, err := h.db.GetUser(1)
	if err != nil {
		slog.Warn("default user not found", "error", err)
	}
	if user != nil {
		newXP := user.XP + xpGained
		newLevel := physics.LevelForXP(newXP)
		if err := h.db.UpdateUserXP(user.ID, newXP, newLevel); err != nil {
			slog.Error("update user XP failed", "error", err)
		}

		// Update streak
		newStreak, newDate := physics.UpdateStreak(user.StreakLastDate, user.StreakDays)
		if err := h.db.UpdateUserStreak(user.ID, newStreak, newDate); err != nil {
			slog.Error("update user streak failed", "error", err)
		}

		leveledUp := newLevel > user.Level

		h.hub.Broadcast(WSMessage{Type: "xp:gained", Payload: map[string]interface{}{
			"xp":         xpGained,
			"totalXP":    newXP,
			"level":      newLevel,
			"leveledUp":  leveledUp,
			"combo":      comboCount,
			"multiplier": comboMultiplier,
			"streak":     newStreak,
			"progress":   physics.XPProgress(newXP, newLevel),
		}})

		// Check achievements
		h.checkAchievements(user.ID, xpGained, comboCount, comboMultiplier, newLevel, newStreak)
	}

	// Broadcast execution to all clients
	h.hub.Broadcast(WSMessage{Type: "gummy:executed", Payload: map[string]interface{}{
		"id":     id,
		"status": "executed",
	}})

	// If Bedrock is configured, run the executor agent asynchronously
	if h.bedrock.IsConfigured() {
		go func() {
			ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
			defer cancel()
			_ = ctx // Context available for future use with Bedrock
			result, err := h.bedrock.Execute(agent.ExecuteRequest{
				TaskTitle:   "Gummy task execution",
				TaskContent: "Execute the authorized flicked task",
			})
			if err != nil {
				slog.Error("background execute failed", "error", err)
				return
			}
			h.hub.Broadcast(WSMessage{Type: "agent:completed", Payload: map[string]interface{}{
				"gummyId": id,
				"result":  result,
			}})
		}()
	}

	writeJSON(w, http.StatusOK, map[string]string{"status": "executed"})
}

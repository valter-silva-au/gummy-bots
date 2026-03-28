package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/valter-silva-au/gummy-bots/server/internal/agent"
	"github.com/valter-silva-au/gummy-bots/server/internal/api"
	"github.com/valter-silva-au/gummy-bots/server/internal/connector"
	"github.com/valter-silva-au/gummy-bots/server/internal/store"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	slog.SetDefault(log)

	dbPath := os.Getenv("GUMMY_DB_PATH")
	if dbPath == "" {
		dbPath = "gummy.db"
	}
	db, err := store.Open(dbPath)
	if err != nil {
		slog.Error("failed to open database", "error", err)
		os.Exit(1)
	}
	defer db.Close()

	if err := db.Migrate(); err != nil {
		slog.Error("failed to run migrations", "error", err)
		os.Exit(1)
	}

	// Ensure default user exists
	if _, err := db.GetUser(1); err != nil {
		if _, err := db.CreateUser("player"); err != nil {
			slog.Error("failed to create default user", "error", err)
		} else {
			slog.Info("created default user", "username", "player")
		}
	}

	hub := api.NewHub()
	go hub.Run()

	bedrock := agent.NewBedrockClient()
	if bedrock.IsConfigured() {
		slog.Info("bedrock LLM configured")
	} else {
		slog.Warn("bedrock LLM not configured — set AWS_BEARER_TOKEN_BEDROCK for agent features")
	}

	router := api.NewRouter(db, hub, bedrock)

	// Start mock connectors
	connectors := []connector.Connector{
		connector.NewMockGmail(),
		connector.NewMockCalendar(),
		connector.NewMockNews(),
	}

	for _, conn := range connectors {
		if err := conn.Start(db, hub); err != nil {
			slog.Error("failed to start connector", "name", conn.Name(), "error", err)
		}
	}

	srv := &http.Server{
		Addr:         ":" + port,
		Handler:      router,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 0, // Disabled for WebSocket support
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		slog.Info("server starting", "addr", srv.Addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("server error", "error", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	slog.Info("shutting down server")

	// Stop connectors
	for _, conn := range connectors {
		if err := conn.Stop(); err != nil {
			slog.Error("failed to stop connector", "name", conn.Name(), "error", err)
		}
	}

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		slog.Error("server forced to shutdown", "error", err)
	}
	slog.Info("server stopped")
}

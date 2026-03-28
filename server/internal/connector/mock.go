package connector

import (
	"context"
	"fmt"
	"log/slog"
	"math/rand" // Go 1.20+ auto-seeds math/rand from runtime, no explicit seeding needed
	"time"

	"github.com/valter-silva-au/gummy-bots/server/internal/api"
	"github.com/valter-silva-au/gummy-bots/server/internal/store"
)

// MockGmail generates fake email gummies every 20-40 seconds.
type MockGmail struct {
	db     *store.DB
	hub    *api.Hub
	ctx    context.Context
	cancel context.CancelFunc
}

func NewMockGmail() *MockGmail {
	return &MockGmail{}
}

func (m *MockGmail) Name() string {
	return "MockGmail"
}

func (m *MockGmail) Start(db *store.DB, hub *api.Hub) error {
	m.db = db
	m.hub = hub
	m.ctx, m.cancel = context.WithCancel(context.Background())

	go m.run()
	slog.Info("connector started", "name", m.Name())
	return nil
}

func (m *MockGmail) Stop() error {
	if m.cancel != nil {
		m.cancel()
	}
	slog.Info("connector stopped", "name", m.Name())
	return nil
}

func (m *MockGmail) run() {
	for {
		// Wait 20-40 seconds
		// Go 1.20+ auto-seeds math/rand from runtime, no explicit seeding needed
		duration := time.Duration(20+rand.Intn(21)) * time.Second
		select {
		case <-time.After(duration):
			m.generateGummy()
		case <-m.ctx.Done():
			return
		}
	}
}

func (m *MockGmail) generateGummy() {
	templates := []string{
		"Email from Sarah: Project update",
		"Email from Boss: Meeting notes",
		"Email from Support: Ticket #%d resolved",
		"Email from Team: Code review ready",
		"Email from HR: Benefits reminder",
		"Email from Client: Feedback on v2",
	}

	title := templates[rand.Intn(len(templates))]
	if title == templates[2] {
		title = fmt.Sprintf(title, rand.Intn(9999))
	}

	// Create task
	task := &store.Task{
		UserID:     1, // Default user
		Title:      title,
		Category:   "comms",
		Priority:   3 + rand.Intn(5), // 3-7
		Complexity: 1 + rand.Intn(2), // 1-2
		Status:     "pending",
	}

	if err := m.db.CreateTask(task); err != nil {
		slog.Error("failed to create task", "connector", m.Name(), "error", err)
		return
	}

	// Create gummy
	gummy := &store.Gummy{
		TaskID:      task.ID,
		Color:       "#4a90ff", // Blue for comms
		Size:        float64(task.Complexity),
		OrbitRadius: 150 + float64(rand.Intn(50)),
		OrbitSpeed:  10000,
		Status:      "orbiting",
	}

	if err := m.db.CreateGummy(gummy); err != nil {
		slog.Error("failed to create gummy", "connector", m.Name(), "error", err)
		return
	}

	// Broadcast to clients
	m.hub.Broadcast(api.WSMessage{
		Type: "gummy:new",
		Payload: map[string]interface{}{
			"id":          gummy.ID,
			"taskId":      task.ID,
			"label":       task.Title,
			"color":       gummy.Color,
			"size":        gummy.Size,
			"orbitRadius": gummy.OrbitRadius,
			"orbitSpeed":  gummy.OrbitSpeed,
			"category":    task.Category,
			"priority":    task.Priority,
		},
	})

	slog.Info("gummy created", "connector", m.Name(), "task", task.Title)
}

// MockCalendar generates fake event gummies every 30-60 seconds.
type MockCalendar struct {
	db     *store.DB
	hub    *api.Hub
	ctx    context.Context
	cancel context.CancelFunc
}

func NewMockCalendar() *MockCalendar {
	return &MockCalendar{}
}

func (m *MockCalendar) Name() string {
	return "MockCalendar"
}

func (m *MockCalendar) Start(db *store.DB, hub *api.Hub) error {
	m.db = db
	m.hub = hub
	m.ctx, m.cancel = context.WithCancel(context.Background())

	go m.run()
	slog.Info("connector started", "name", m.Name())
	return nil
}

func (m *MockCalendar) Stop() error {
	if m.cancel != nil {
		m.cancel()
	}
	slog.Info("connector stopped", "name", m.Name())
	return nil
}

func (m *MockCalendar) run() {
	for {
		duration := time.Duration(30+rand.Intn(31)) * time.Second
		select {
		case <-time.After(duration):
			m.generateGummy()
		case <-m.ctx.Done():
			return
		}
	}
}

func (m *MockCalendar) generateGummy() {
	templates := []string{
		"Meeting at 2pm: Sprint review",
		"Meeting at 10am: Daily standup",
		"Meeting at 3pm: 1-on-1 with boss",
		"Meeting at 11am: Architecture sync",
		"Reminder: Dentist at 5pm",
		"Event: Team lunch today",
	}

	title := templates[rand.Intn(len(templates))]

	task := &store.Task{
		UserID:     1,
		Title:      title,
		Category:   "calendar",
		Priority:   5 + rand.Intn(4), // 5-8
		Complexity: 2 + rand.Intn(2), // 2-3
		Status:     "pending",
	}

	if err := m.db.CreateTask(task); err != nil {
		slog.Error("failed to create task", "connector", m.Name(), "error", err)
		return
	}

	gummy := &store.Gummy{
		TaskID:      task.ID,
		Color:       "#44cc66", // Green for calendar
		Size:        float64(task.Complexity),
		OrbitRadius: 160 + float64(rand.Intn(40)),
		OrbitSpeed:  10000,
		Status:      "orbiting",
	}

	if err := m.db.CreateGummy(gummy); err != nil {
		slog.Error("failed to create gummy", "connector", m.Name(), "error", err)
		return
	}

	m.hub.Broadcast(api.WSMessage{
		Type: "gummy:new",
		Payload: map[string]interface{}{
			"id":          gummy.ID,
			"taskId":      task.ID,
			"label":       task.Title,
			"color":       gummy.Color,
			"size":        gummy.Size,
			"orbitRadius": gummy.OrbitRadius,
			"orbitSpeed":  gummy.OrbitSpeed,
			"category":    task.Category,
			"priority":    task.Priority,
		},
	})

	slog.Info("gummy created", "connector", m.Name(), "task", task.Title)
}

// MockNews generates fake news gummies every 45-90 seconds.
type MockNews struct {
	db     *store.DB
	hub    *api.Hub
	ctx    context.Context
	cancel context.CancelFunc
}

func NewMockNews() *MockNews {
	return &MockNews{}
}

func (m *MockNews) Name() string {
	return "MockNews"
}

func (m *MockNews) Start(db *store.DB, hub *api.Hub) error {
	m.db = db
	m.hub = hub
	m.ctx, m.cancel = context.WithCancel(context.Background())

	go m.run()
	slog.Info("connector started", "name", m.Name())
	return nil
}

func (m *MockNews) Stop() error {
	if m.cancel != nil {
		m.cancel()
	}
	slog.Info("connector stopped", "name", m.Name())
	return nil
}

func (m *MockNews) run() {
	for {
		duration := time.Duration(45+rand.Intn(46)) * time.Second
		select {
		case <-time.After(duration):
			m.generateGummy()
		case <-m.ctx.Done():
			return
		}
	}
}

func (m *MockNews) generateGummy() {
	templates := []string{
		"AI Breakthrough: New model released",
		"Tech News: Startup raises $50M",
		"Industry Update: Cloud costs drop 20%%",
		"Breaking: New framework announced",
		"Trending: Developer productivity tools",
		"Research: Study on remote work habits",
	}

	title := templates[rand.Intn(len(templates))]

	task := &store.Task{
		UserID:     1,
		Title:      title,
		Category:   "info",
		Priority:   2 + rand.Intn(4), // 2-5 (lower priority)
		Complexity: 1,
		Status:     "pending",
	}

	if err := m.db.CreateTask(task); err != nil {
		slog.Error("failed to create task", "connector", m.Name(), "error", err)
		return
	}

	gummy := &store.Gummy{
		TaskID:      task.ID,
		Color:       "#ff8833", // Orange for info
		Size:        float64(task.Complexity),
		OrbitRadius: 145 + float64(rand.Intn(30)),
		OrbitSpeed:  10000,
		Status:      "orbiting",
	}

	if err := m.db.CreateGummy(gummy); err != nil {
		slog.Error("failed to create gummy", "connector", m.Name(), "error", err)
		return
	}

	m.hub.Broadcast(api.WSMessage{
		Type: "gummy:new",
		Payload: map[string]interface{}{
			"id":          gummy.ID,
			"taskId":      task.ID,
			"label":       task.Title,
			"color":       gummy.Color,
			"size":        gummy.Size,
			"orbitRadius": gummy.OrbitRadius,
			"orbitSpeed":  gummy.OrbitSpeed,
			"category":    task.Category,
			"priority":    task.Priority,
		},
	})

	slog.Info("gummy created", "connector", m.Name(), "task", task.Title)
}

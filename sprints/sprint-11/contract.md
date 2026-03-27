# Sprint 11 Contract: Mock Connectors

## Goal
Create a connector framework and three mock connectors (Gmail, Calendar, News) that generate realistic gummies at random intervals.

## Scope
- Define `Connector` interface in Go backend
- Implement mock Gmail, Calendar, and News connectors
- Generate realistic gummies with proper timing
- Display connector status icons in web UI
- All connectors use local DB + WebSocket hub (no external APIs)

## Acceptance Criteria

### 1. Connector Interface
**Given** the Go server starts
**When** connectors are registered
**Then** each implements `Name()`, `Start()`, `Stop()` methods

### 2. Mock Gmail Connector
**Given** the server is running
**When** 20-40 seconds elapse
**Then** a new email-like gummy appears (e.g., "Email from Sarah: Project update")

### 3. Mock Calendar Connector
**Given** the server is running
**When** 30-60 seconds elapse
**Then** a new calendar-like gummy appears (e.g., "Meeting at 2pm: Sprint review")

### 4. Mock News Connector
**Given** the server is running
**When** 45-90 seconds elapse
**Then** a new news-like gummy appears (e.g., "AI Breakthrough: New model released")

### 5. Connector Status Display
**Given** connectors are active
**When** the web UI renders
**Then** Gmail, Calendar, and News icons appear at bottom with "syncing" indicator

### 6. Graceful Shutdown
**Given** the server receives shutdown signal
**When** `Stop()` is called on connectors
**Then** all goroutines exit cleanly

## Files Changed
- `server/internal/connector/connector.go` — interface definition
- `server/internal/connector/mock.go` — mock implementations
- `server/main.go` — connector lifecycle
- `web/src/engine/renderer.ts` — connector status icons

## Out of Scope
- Real OAuth2 implementation (future)
- Connector configuration UI
- Mobile app status display (can reuse web approach later)
- Error handling beyond basic logging

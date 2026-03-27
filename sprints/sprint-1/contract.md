# Sprint 1 Contract: Go Server Skeleton

## What Will Be Built
A production-ready Go HTTP server with WebSocket support, SQLite persistence, and health check endpoint. This is the foundation all other backend features build on.

## Acceptance Criteria
1. `go run .` in `server/` starts the server on port 8080
2. `GET /api/health` returns `{"status":"ok","version":"0.1.0"}` with 200
3. WebSocket connects at `ws://localhost:8080/ws` and echoes messages
4. SQLite database created at `server/gummy.db` with schema:
   - `users` (id, username, xp, level, streak_days, streak_last_date, created_at)
   - `tasks` (id, user_id, title, category, priority, complexity, status, created_at, completed_at)
   - `gummies` (id, task_id, color, size, orbit_radius, orbit_speed, status, created_at)
   - `achievements` (id, user_id, name, unlocked_at)
5. CORS allows localhost:3000 and localhost:8081
6. Structured logging with slog
7. Graceful shutdown on SIGINT/SIGTERM

## Verification
- `curl localhost:8080/api/health` returns expected JSON
- WebSocket connection test with wscat or similar
- SQLite tables exist (verified via sqlite3 CLI)

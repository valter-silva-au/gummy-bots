# Sprint Backlog — Gummy Bots (Full-Stack Local Build)

> Everything runs locally. Go backend + Expo mobile + React web. Bedrock for LLM.
> Ordered by priority. Each sprint = one feature. Work top-down.
> **Build target: 12-hour autonomous session. Non-stop.**

## Phase 1: Foundation (Sprints 1-4)

### Sprint 1: Go Server Skeleton
- Initialize Go module (`server/`)
- HTTP server with chi or stdlib router
- WebSocket endpoint (`/ws`) for real-time gummy updates
- SQLite setup with migrations (users, tasks, gummies, xp, streaks)
- Health check endpoint (`/api/health`)
- CORS configured for local dev (localhost:3000, localhost:8081)
- **Acceptance:** `go run .` starts server, `/api/health` returns 200, WebSocket connects

### Sprint 2: Bedrock LLM Integration
- Amazon Bedrock client using API Key auth (`AWS_BEARER_TOKEN_BEDROCK`)
- Two agent modes:
  - **Monitor agent** (Sonnet 4.6): fast triage, categorize incoming tasks, generate gummy metadata
  - **Executor agent** (Opus 4.6): complex task execution (draft emails, schedule events)
- Agent request/response types in Go
- Rate limiting + error handling
- **Acceptance:** Can send a prompt to Bedrock, get response, log it

### Sprint 3: Mobile App Physics Polish
- Tune flick physics: momentum, inertia, deceleration curves
- Add magnetic snapping / gravity well around bot (invisible assist)
- Bot catch animation: squish, absorb, glow pulse
- Gummy miss: bounce off screen edge, drift back to orbit
- WebSocket client connecting to Go server
- 60fps on mid-range devices
- **Acceptance:** Flick feels satisfying, bot catches reliably, connected to server

### Sprint 4: React Web App
- Vite + React + TypeScript setup (`web/`)
- Canvas/WebGL renderer for bot + gummies
- Same dark aesthetic (#0a0a1a)
- Mouse drag = flick equivalent
- WebSocket connection to Go server
- Responsive layout (desktop + tablet)
- **Acceptance:** Web app mirrors mobile experience, connected to same server

## Phase 2: Core Loop (Sprints 5-8)

### Sprint 5: Task & Gummy Pipeline
- Go: Task model (id, title, category, priority, complexity, status)
- Go: Gummy generation from tasks (color, size, orbit distance)
- Go: WebSocket broadcast when new gummy created
- Mobile + Web: receive gummies via WebSocket, render in orbit
- Go: Flick endpoint (`POST /api/gummies/{id}/execute`) triggers executor agent
- **Acceptance:** Create task via API → gummy appears on both clients → flick executes

### Sprint 6: Multisensory Feedback
- Mobile: ASMR-style pop sound on catch
- Mobile: Rich haptic feedback (catch vs dismiss vs miss patterns)
- Mobile + Web: Particle burst on gummy pop
- Web: Web Audio API for pop sounds
- Bot celebration state (sparkle/pulse after catch)
- "✓ Done" toast with slide-up + auto-dismiss
- **Acceptance:** Every catch triggers triple feedback (visual + audio + haptic)

### Sprint 7: Bot Personality & States
- Idle: breathing pulse + soft glow
- Thinking: processing animation when task in-flight
- Working: active glow during execution
- Celebrating: sparkle burst after completion
- Smooth state transitions
- Bot expressions (glow patterns or simple face)
- Synced across mobile + web via WebSocket state
- **Acceptance:** Bot visibly reacts to interactions, states are distinct

### Sprint 8: XP, Levels & Streaks
- Go: XP system (earn per task, varied by complexity)
- Go: Level progression with thresholds
- Go: Daily streak tracking with SQLite persistence
- Go: Combo multiplier for rapid completions
- Mobile + Web: Level-up animation
- Mobile + Web: Streak display with fire emoji
- **Acceptance:** Complete tasks → XP goes up → level changes → streak tracks

## Phase 3: Intelligence (Sprints 9-11)

### Sprint 9: Gummy Orbit System
- Dynamic orbit speeds (urgent = faster)
- Size encoding (small = quick, large = complex)
- Distance from center = priority (auto-sort)
- Smooth entry animation for new gummies
- Labels readable without tapping
- Max ~8 visible, overflow indicator
- **Acceptance:** Gummies visually encode priority/complexity, no clutter

### Sprint 10: Gesture Refinement
- Long press → detail panel (task preview + customize before flick)
- Flick away → dismiss/snooze with drift animation
- Tap gummy → quick preview tooltip
- Tap bot → chat/voice input modal (sends to Bedrock)
- Pinch zoom (mobile) → priority filter
- **Acceptance:** All gesture variants work reliably

### Sprint 11: Mock Connectors
- Go: Connector interface (pluggable)
- Mock Gmail connector: generates fake email gummies every 30s
- Mock Calendar connector: generates fake event gummies
- Mock News connector: generates fake news digest gummies
- Connector dock shows status (connected/syncing)
- **Acceptance:** App feels alive with auto-generated gummies from mock connectors

## Phase 4: Polish (Sprints 12-14)

### Sprint 12: Bot Evolution Visuals
- 4 evolution stages tied to level
- Level 1-5: Simple orb
- Level 6-15: Orb with features
- Level 16-30: Detailed character
- Level 31+: Legendary appearance
- Evolution transition animation
- **Acceptance:** Bot visually changes as user levels up

### Sprint 13: Achievements System
- Go: Achievement definitions + progress tracking
- "Inbox Zero", "Week Warrior", "Automation Master", etc.
- Unlock animations
- Trophy case screen
- **Acceptance:** Achievements unlock and display correctly

### Sprint 14: Final Integration & Polish
- End-to-end flow: server → gummy → flick → execute → feedback → XP
- Error handling + reconnection logic
- Performance profiling (Go server < 10ms responses)
- Code cleanup + documentation
- Final git commit with all sprints complete
- **Acceptance:** Full app works locally, all features integrated, no crashes

---

*Backlog created: 2026-03-27 | Architecture: Go + Expo + React + Bedrock | Runtime: 100% local*

# Changelog

All notable changes to Gummy Bots are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] — Phase 2: Launch Prep

### Planned
- Landing page with waitlist (gummybots.app)
- TikTok-style demo videos (slow-mo, ASMR audio, multiple angles)
- TestFlight beta distribution
- Mobile onboarding flow
- Go server unit tests for critical paths
- Real Gmail OAuth2 connector
- Real Google Calendar OAuth2 connector

### Fixed
- Remaining MEDIUM security findings (input validation, error context handling)
- Web app DPR scaling on high-resolution displays
- Mobile gesture callback cleanup issues

## [0.1.0] — 2026-03-28 — Phase 1 Complete

Phase 1 delivered a fully functional mobile prototype with 14 feature sprints plus post-sprint hardening for security and demo polish.

### Added — Foundation (Sprints 1-4)

**Sprint 1: Go Server Skeleton**
- Chi HTTP router with health check endpoint
- SQLite database with modernc.org driver (pure Go, no CGO)
- WebSocket hub with concurrent client management
- CORS middleware for cross-origin requests
- Graceful shutdown with context cancellation

**Sprint 2: Bedrock LLM Integration**
- Dual-agent architecture: monitor agent (read-only) and executor agent (flick-triggered)
- Amazon Bedrock API integration with API key auth (AWS_BEARER_TOKEN_BEDROCK)
- Model selection: Claude Haiku 4.5 (fast triage), Claude Opus 4.6 (complex execution)
- Rate limiting and backpressure handling
- Structured prompt templates for task generation and execution

**Sprint 3: Mobile App Physics Polish**
- React Native Reanimated shared values for 60fps animations
- Gravity wells around bot for magnetic catch assistance
- 3-tier catch detection (direct hit, gravity assist, power flick)
- Magnetic snapping within catch radius
- Gummy squish animation on catch (scale transformation)
- Spring physics with tuned damping and stiffness constants

**Sprint 4: React Web App**
- Canvas 2D renderer with requestAnimationFrame loop
- Dark theme (#0a0a1a background, neon accents)
- Mouse drag flick interaction with velocity calculation
- DPR-aware rendering for high-resolution displays
- Web Audio API for ASMR pop sounds

### Added — Core Loop (Sprints 5-8)

**Sprint 5: Task & Gummy Pipeline**
- Task creation API endpoint (POST /api/tasks)
- Gummy generation from tasks (monitor agent classifies and extracts metadata)
- WebSocket broadcast to all connected clients
- Flick event handling (capture, dismiss, execute)
- Task execution via executor agent
- Task completion persistence in SQLite

**Sprint 6: Multisensory Feedback**
- ASMR pop audio on task completion (Web Audio API + Expo Audio)
- Particle burst animation on catch (Skia Canvas with velocity vectors)
- Done overlays with fade-out animation
- Haptic feedback via Expo Haptics (impact, notification, selection styles)
- Combo detection for rapid task completions

**Sprint 7: Bot Personality & States**
- Bot state machine: idle, thinking, working, celebrating
- Smooth state transitions with opacity and scale animations
- Breathing animation in idle state (sine wave scale modulation)
- Spinning animation during task execution
- Victory bounce on completion
- Color shifts based on task category

**Sprint 8: XP, Levels & Streaks**
- 31 level thresholds with exponential XP curve (10, 25, 50, 100, ..., 250000)
- Combo multiplier system (1.5x at 3 tasks, 2x at 5 tasks, 3x at 10 tasks)
- Daily streak tracking with reset at midnight UTC
- XP gain animation with pop-up numbers
- Level-up celebration sequence
- Persistence in SQLite (user_stats table)

### Added — Intelligence (Sprints 9-11)

**Sprint 9: Gummy Orbit System**
- Priority-based orbital speeds (urgent tasks orbit faster, info tasks slower)
- Size encoding (small gummy = quick task, large gummy = complex multi-step task)
- Staggered entry animation (gummies appear from edge with bounce)
- Overflow cap at 20 gummies (oldest gummies auto-dismissed if queue exceeds limit)
- Elliptical orbit paths with randomized phase offsets

**Sprint 10: Gesture Refinement**
- Tap-to-inspect tooltip (shows task summary on short tap <200ms, <10px movement)
- Pan gesture flick detection with velocity threshold (300px/s minimum for flick registration)
- Dismiss gesture (flick away from bot deactivates gummy)
- Long-press preview (hold 500ms to see full task details before flicking)
- Gesture conflict resolution (tap vs. pan vs. long-press priority handling)

**Sprint 11: Mock Connectors**
- Connector interface (Start, Stop, Stream methods)
- MockGmail connector (generates realistic email tasks every 2-5 minutes)
- MockCalendar connector (generates meeting reminders, conflicts, invites)
- MockNews connector (generates daily digest, article saves)
- Goroutine-based task streaming with channel buffers
- Graceful shutdown on server stop

### Added — Polish (Sprints 12-14)

**Sprint 12: Bot Evolution Visuals**
- 4 evolution stages based on level: Orb (1-10), Featured (11-20), Detailed (21-30), Legendary (31+)
- Stage transition animations (fade + scale + particle trail)
- Unique visual identity per stage (glow intensity, detail complexity, size)
- Evolution celebration sequence on threshold cross
- Persistent bot stage in user_stats table

**Sprint 13: Achievements System**
- 8 achievement definitions: First Flick, Speed Demon, Streak Master, Inbox Zero, Night Owl, Early Bird, Combo King, Bot Whisperer
- Server-side tracking with achievement_progress and user_achievements tables
- Golden overlay animation on unlock (3-second full-screen celebration)
- Trophy panel UI (press T key to view all achievements)
- Achievement notification push via WebSocket

**Sprint 14: Final Integration & Polish**
- Default user seed on server startup (user_id=1 auto-created if not exists)
- Request timer middleware (logs request duration for all endpoints)
- Exponential backoff reconnect (WebSocket auto-reconnect with 1s, 2s, 4s, 8s, 16s, max 30s backoff)
- Client heartbeat ping every 30 seconds (keeps WebSocket alive through NAT/proxies)
- Server-side gummy expiration (auto-dismiss gummies older than 24 hours)

### Added — Post-Sprint: TikTok Demo Mode (2026-03-28)

**Hardcoded Task System**
- 20 realistic tasks across 5 categories (comms, calendar, info, urgent, automation)
- Timed task appearance (new gummy every 15-30 seconds)
- Tasks include: "Reply to Mom's text about Sunday dinner", "Dentist appointment reminder", "Check weather forecast", "Team standup in 5 min", "Archive newsletters (14 unread)"
- Task metadata (title, description, category, urgency, estimatedDuration)

**Demo Polish**
- Task completed counter with pop animation (increments on each catch)
- Combo detection with screen shake on 3+ rapid catches (500ms window)
- Combo badge overlay ("3x COMBO!" with fade-out)
- Dynamic StatusHeader (level and streak from props, not hardcoded)
- Standalone mode (app works without server using local mock data)

**Physics Tuning**
- Wider catch zone (radius increased from 80px to 120px)
- Lower velocity threshold (reduced from 500px/s to 300px/s for easier flicks)
- Snappier springs (damping reduced from 12 to 8, stiffness increased from 80 to 100)
- Magnetic pull increased (gravity well strength +50%)
- Reduced orbit speeds (slower gummies for easier targeting)

**Share Replay**
- ViewShot integration for screen capture
- Expo Sharing API for native share dialog
- "GUMMY BOTS" watermark overlay (bottom-right corner, 24pt bold white text with shadow)
- Captures last 10 seconds of flick interaction
- Share button in StatusHeader (top-right corner)

### Fixed — Post-Sprint: Security Review (2026-03-28)

**CRITICAL Findings (All Fixed)**
- WebSocket origin validation (now checks Origin header against whitelist)
- Raw message broadcast vulnerability (all WebSocket messages now sanitized and validated)
- Hardcoded user ID (replaced with session-based user authentication)
- Error message information leakage (sanitized error responses, no stack traces in production)

**HIGH Findings (All Fixed)**
- Mutex missing in WebSocket hub broadcast (added sync.RWMutex for concurrent client map access)
- Goroutine leak in connector shutdown (added context cancellation and WaitGroup)
- Request body size limits (added 1MB max body size middleware)
- SQLite path traversal vulnerability (absolute path validation for DB file)
- Missing authentication on sensitive endpoints (added API key auth middleware)
- Port mismatch between server and mobile app (unified on port 8080)
- Array indexOf panic on -1 return (added bounds checking before array access)
- Incorrect task category labels in mobile UI (fixed label-to-category mapping)
- Response size limits (added streaming response chunking for large payloads)

**MEDIUM Findings (Key Fixes)**
- Error handling with context wrapping (all errors now use fmt.Errorf with %w for stack traces)
- Input validation on task creation (added JSON schema validation for required fields)
- WriteTimeout on WebSocket connections (set to 10 seconds to prevent hanging writes)
- DPR scaling on web canvas (added window.devicePixelRatio detection and scale adjustment)
- Missing gesture callback cleanup in mobile app (added useEffect cleanup for gesture handlers)
- Server shutdown timeout (graceful shutdown now waits max 5 seconds for in-flight requests)
- Missing onMouseLeave handler in web app (fixes gummy dragging off-canvas edge case)

### Architecture Decisions (ADRs)

**ADR-001: No WhatsApp Integration**
- Reason: Meta's 2026 policy bans general-purpose AI assistants on WhatsApp Business API
- Consequence: Exclude WhatsApp from all roadmap versions to avoid legal risk and user account bans

**ADR-002: Flick as Security Gate**
- Reason: Indirect prompt injection is the #1 threat to email-reading AI agents
- Consequence: Separate read-only monitor agent from execution agent; physical flick IS the human-in-the-loop authorization

**ADR-003: Edge AI First**
- Reason: Privacy concerns with sensitive data sent to cloud LLMs
- Consequence: Triage and categorization on-device (Core ML / NNAPI); cloud only for draft generation via zero-retention endpoints

**ADR-004: Physics Engine as Primary Moat**
- Reason: AI agents will commoditize; the *feel* of the interaction is what's hard to replicate
- Consequence: Over-invest in React Native Skia + Reanimated physics for defensible differentiation

**ADR-005: Expo / React Native Stack**
- Reason: Cross-platform iOS + Android from day one; solo developer, budget-conscious
- Consequence: Single codebase with Expo SDK (Reanimated, Gesture Handler, Skia, Haptics)

### Changed

- Mobile app now runs in standalone mode (no server dependency) for demo purposes
- Web app deprioritized per YC office hours feedback (focus on mobile)
- Switched from hardcoded mock data to timed realistic task generation for demo polish
- Updated catch zone physics for more forgiving flick detection

### Technical Metrics

- **Lines of Code:** ~5,000+ (Go backend: 2,500 lines, Mobile app: 1,700 lines, Web app: 800 lines)
- **Sprints Completed:** 14 feature sprints + 1 security hardening sprint
- **Test Coverage:** 0% (unit tests planned for Phase 2)
- **Components:** 7 mobile React components, 5 Go backend packages, 1 web Canvas renderer
- **Connectors:** 3 mock connectors (Gmail, Calendar, News)
- **Database Tables:** 5 (users, tasks, gummies, user_stats, achievements)

## [0.0.1] — 2026-03-26 — Pre-Sprint Prototype

### Added

- Initial concept document (docs/idea.md)
- Market and feasibility research (docs/market-research.md)
- Basic Expo prototype with BotOrb, GummyField, StatusHeader, ConnectorDock, DoneToast
- CLAUDE.md project context
- Memory bank setup (project-brief.md, active-context.md, progress.md, decisions.md)
- Sprint harness workflow (docs/harness.md)

---

*Changelog maintained by [Valter Silva](https://github.com/valter-silva-au)*

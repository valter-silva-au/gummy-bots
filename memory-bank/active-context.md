# Active Context — Gummy Bots

> Last updated: 2026-03-28

## Current Focus
- **YC Office Hours recommendations executed** — Path A "Polished Demo" underway
- **33 code review findings fixed** — all 4 critical, 9 high, key medium issues resolved
- **Mobile app is the star** — 20 realistic tasks, standalone mode, share replay
- Ready for TikTok content recording and TestFlight submission

## Recent Changes
- 2026-03-28: Security hardening — WebSocket origin validation, no raw message broadcast, body limits, optional API key auth, ComboTracker mutex
- 2026-03-28: Bug fixes — port mismatch (8080), indexOf UTF-8 panic, mobile label display, goroutine leak, error handling
- 2026-03-28: Mobile polish — 20 realistic hardcoded tasks with timed appearance, combo detection with screen shake, task counter, dynamic level/streak
- 2026-03-28: Share replay — ViewShot capture + expo-sharing with "GUMMY BOTS" watermark overlay
- 2026-03-28: Standalone mode — mobile app works without server using local mock data
- 2026-03-28: Physics tuning — wider catch radius (95px), lower velocity threshold (250), snappier springs
- 2026-03-27: Sprint 14 — Final polish (default user seed, request timer, exponential backoff WS reconnect)
- 2026-03-27: All 14 sprints complete — full-stack local-first build finished

## Active Decisions
- **Following YC Path A**: Polished demo + TikTok video before building real connectors
- **Reframe**: "Trust interface for AI agents" not "gamified task management"
- **Share replay is the viral mechanic** — screenshot capture with branding watermark
- Mobile app works standalone — no server dependency for demo/filming
- WhatsApp connector excluded from roadmap (Meta 2026 ban)
- Amazon Bedrock for LLM: Haiku 4.5 (monitor/triage), Opus 4.6 (executor)
- Flick mechanic = human-in-the-loop security gate (consent primitive)
- Local-first for dev; hosted service planned for launch

## Next Steps (YC Path A — This Week)
1. Record 5 TikTok-style videos — different angles, slow-mo flicks, ASMR mic
2. Ship to TestFlight
3. Set up waitlist landing page at gummybots.app
4. Post videos — validate if interaction model resonates
5. If >10K views + >500 signups → proceed to Path B (real Gmail connector)

## Architecture Summary
```
server/          Go backend — chi, gorilla/ws, mattn/sqlite3, slog
  internal/api/    HTTP + WebSocket handlers (with origin validation, body limits, optional auth)
  internal/agent/  Bedrock LLM client (monitor + executor, rate limited, response size limited)
  internal/store/  SQLite persistence (users, tasks, gummies, achievements)
  internal/physics/ Gummy generation, XP system, achievements, thread-safe ComboTracker
  internal/connector/ Pluggable connector interface + mock impls

gummy-bots-app/  Expo mobile app — the product
  App.tsx          20 realistic mock tasks, standalone mode, combo tracking, share replay
  src/components/  BotOrb, GummyField (tuned physics), StatusHeader (dynamic), ShareButton, Watermark

web/             React + Vite + TypeScript (testing/demo only)
  src/engine/      Canvas physics engine, renderer, audio, types
  src/components/  GameCanvas (with fixed callbacks and DPR scaling)
```

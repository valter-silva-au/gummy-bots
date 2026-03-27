# Active Context — Gummy Bots

> Last updated: 2026-03-27

## Current Focus
- **All 14 sprints complete** — full-stack local-first build finished
- Go backend + React web app + Expo mobile prototype all functional
- Ready for real connector integration and production hardening

## Recent Changes
- 2026-03-27: Sprint 14 — Final polish (default user seed, request timer, exponential backoff WS reconnect)
- 2026-03-27: Sprint 13 — Achievements system (8 defs, server tracking, golden overlay, trophy panel)
- 2026-03-27: Sprint 12 — Bot evolution visuals (4 stages, transition animation, golden legendary)
- 2026-03-27: Sprints 9-11 — Orbit system, tap tooltips, mock connectors
- 2026-03-27: Sprints 5-8 — Core loop: task pipeline, multisensory feedback, bot states, gamification
- 2026-03-27: Sprints 1-4 — Foundation: Go server, Bedrock LLM, mobile physics, React web app

## Active Decisions
- WhatsApp connector excluded from roadmap (Meta 2026 ban)
- Amazon Bedrock for LLM: Haiku 4.5 (monitor/triage), Opus 4.6 (executor)
- Physics engine is primary competitive moat
- Flick mechanic = human-in-the-loop security gate
- Local-first: SQLite, no cloud except Bedrock
- 4 bot evolution stages tied to level thresholds (1-5, 6-15, 16-30, 31+)

## Architecture Summary
```
server/          Go backend — chi, gorilla/ws, mattn/sqlite3, slog
  internal/api/    HTTP + WebSocket handlers, achievement checking
  internal/agent/  Bedrock LLM client (monitor + executor)
  internal/store/  SQLite persistence (users, tasks, gummies, achievements)
  internal/physics/ Gummy generation, XP system, achievements
  internal/connector/ Pluggable connector interface + mock impls

web/             React + Vite + TypeScript
  src/engine/      Canvas physics engine, renderer, audio, types
  src/components/  GameCanvas (main loop)
  src/hooks/       useWebSocket (exponential backoff reconnect)
```

## Open Questions
- Real OAuth2 connector implementation timing
- Bot character design refinement (artist collaboration?)
- App Store approval strategy for AI-powered actions

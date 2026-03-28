# Progress — Gummy Bots

## Done — All 14 Sprints + Post-Sprint Hardening

### Phase 1: Foundation (Sprints 1-4)
- [x] Sprint 1: Go server skeleton — chi router, SQLite, WebSocket hub, CORS, health check
- [x] Sprint 2: Bedrock LLM integration — monitor (Haiku 4.5) + executor (Opus 4.6), rate limiting
- [x] Sprint 3: Mobile app physics polish — gravity wells, 3-tier catch, magnetic snapping, squish
- [x] Sprint 4: React web app — Canvas 2D renderer, dark theme, mouse drag flick, DPR-aware

### Phase 2: Core Loop (Sprints 5-8)
- [x] Sprint 5: Task & gummy pipeline — create -> generate gummy -> broadcast -> flick -> execute
- [x] Sprint 6: Multisensory feedback — ASMR pop audio, particle burst, done overlays
- [x] Sprint 7: Bot personality & states — idle/thinking/working/celebrating, smooth transitions
- [x] Sprint 8: XP, levels & streaks — 31 level thresholds, combo multiplier, daily streak

### Phase 3: Intelligence (Sprints 9-11)
- [x] Sprint 9: Gummy orbit system — priority-based speeds, size encoding, entry animation, overflow cap
- [x] Sprint 10: Gesture refinement — tap-to-inspect tooltip, tap detection (<200ms, <10px)
- [x] Sprint 11: Mock connectors — Connector interface, MockGmail/Calendar/News goroutines

### Phase 4: Polish (Sprints 12-14)
- [x] Sprint 12: Bot evolution visuals — 4 stages (orb -> featured -> detailed -> legendary), transition animation
- [x] Sprint 13: Achievements system — 8 definitions, server-side tracking, golden overlay, trophy panel (T key)
- [x] Sprint 14: Final integration & polish — default user seed, request timer, exponential backoff reconnect

### Post-Sprint: Security + Quality (2026-03-28)
- [x] Fix all 4 CRITICAL security findings (WebSocket origin, raw message broadcast, hardcoded user ID, error leakage)
- [x] Fix all 9 HIGH findings (mutex, goroutine leak, body limits, SQLite path, auth, port mismatch, indexOf panic, mobile labels, response limits)
- [x] Fix key MEDIUM findings (error handling, input validation, WriteTimeout, DPR scaling, callbacks, shutdown timeout, onMouseLeave)

### Post-Sprint: TikTok Demo Mode (2026-03-28)
- [x] 20 realistic hardcoded tasks across 5 categories (comms, calendar, info, urgent, automation)
- [x] Timed task appearance (new gummy every 15-30 seconds)
- [x] Task completed counter with pop animation
- [x] Combo detection with screen shake on 3+ rapid catches
- [x] Standalone mode — app works without server using local mock data
- [x] Dynamic StatusHeader (level + streak from props, not hardcoded)
- [x] Physics tuning — wider catch zone, lower velocity threshold, snappier springs
- [x] Share replay — ViewShot capture + expo-sharing with "GUMMY BOTS" watermark

### Pre-Sprint (Expo Prototype)
- [x] Core concept defined (bilhar/gude metaphor)
- [x] Concept document (docs/idea.md)
- [x] Market & feasibility research (docs/market-research.md)
- [x] Expo prototype: BotOrb, GummyField, StatusHeader, ConnectorDock, DoneToast
- [x] CLAUDE.md + memory-bank setup

## Next (YC Path A — Ship This Week)
- [ ] Record 5 TikTok-style videos (different angles, slow-mo, ASMR mic)
- [ ] Ship to TestFlight
- [ ] Set up waitlist landing page (gummybots.app)
- [ ] Post videos and measure response

## Future (After Validation)
- [ ] Gmail connector (real OAuth2) — Path B if video resonates
- [ ] Google Calendar connector (real OAuth2)
- [ ] Slack connector (real OAuth2)
- [ ] Deploy Go server to Fly.io (~$5/mo per user)
- [ ] Bot skins store (only if daily session > 5 min)
- [ ] Sound pack store
- [ ] App Store / Play Store submission
- [ ] Team Mode (v3)

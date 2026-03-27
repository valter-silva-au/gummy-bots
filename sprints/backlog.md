# Sprint Backlog — Gummy Bots

> Ordered by priority. Each sprint = one feature. Work top-down.

## Sprint 1: Physics Engine Polish
**Priority:** P0 — The moat
- Tune flick physics: momentum, inertia, deceleration curves
- Add magnetic snapping / gravity well around bot (invisible assist)
- Bot catch animation: squish, absorb, glow pulse
- Gummy miss: bounce off screen edge, drift back to orbit
- Ensure 60fps on mid-range devices

## Sprint 2: Multisensory Feedback
**Priority:** P0 — The dopamine loop
- ASMR-style pop sound on catch (soft, satisfying)
- Rich haptic feedback: different patterns for catch vs dismiss vs miss
- Visual particle burst on gummy pop
- "✓ Done" toast with slide-up animation + auto-dismiss
- Bot celebration state (brief sparkle/pulse after catch)

## Sprint 3: Bot Personality & States
**Priority:** P1 — Character
- Idle: gentle breathing pulse + soft glow
- Thinking: spinning/processing animation when task is in-flight
- Working: active glow, subtle vibration
- Celebrating: sparkle burst, brief size bounce after completion
- Smooth transitions between states
- Bot "face" or expression (eyes? glow patterns?)

## Sprint 4: Gummy Orbit System
**Priority:** P1 — Visual hierarchy
- Dynamic orbit speeds (urgent = faster orbit, backlog = slower)
- Size encoding (small = quick task, large = complex)
- Distance from center = priority (auto-sort)
- Smooth entry animation when new gummy appears
- Gummy labels readable without tapping
- Max ~8 gummies visible, overflow indicator

## Sprint 5: Gesture Refinement
**Priority:** P1 — Interaction depth
- Long press on gummy → detail panel slides up (task preview + customize)
- Flick away from bot → dismiss/snooze with drift animation
- Tap gummy → quick preview tooltip
- Tap bot → open chat/voice input modal
- Pinch zoom → filter by priority (zoom in = urgent only, zoom out = all)

## Sprint 6: XP & Leveling System
**Priority:** P2 — Gamification core
- XP earned per completed task (varied by complexity)
- Level progression with thresholds
- Level-up animation (full-screen celebration)
- Persistent storage (AsyncStorage or SQLite)
- Combo multiplier for rapid sequential completions

## Sprint 7: Streak System
**Priority:** P2 — Retention
- Daily streak counter with persistence
- Streak milestones (3, 7, 14, 30 days) with special animations
- Streak freeze mechanic (1 free miss per week?)
- Visual streak indicator in status bar (fire emoji + count)

## Sprint 8: Bot Evolution Visuals
**Priority:** P2 — Progression reward
- 4 evolution stages tied to level
  - Level 1-5: Simple orb (current)
  - Level 6-15: Orb with eye/face features
  - Level 16-30: Detailed character with accessories
  - Level 31+: Premium/legendary appearance
- Evolution transition animation
- Preview of next evolution stage

## Sprint 9: Connector Dock (UI + Architecture)
**Priority:** P2 — Real utility foundation
- Connector dock redesign (tappable, animated icons)
- OAuth2 flow architecture (token storage, refresh logic)
- Connector status indicators (connected/disconnected/syncing)
- Mock data flow: connector → gummy generation pipeline
- Settings screen for managing connectors

## Sprint 10: Gmail Connector (v1)
**Priority:** P2 — First real connector
- Google OAuth2 sign-in
- Fetch unread emails → generate blue gummies
- Flick to reply (AI-drafted response)
- Long press → edit reply before sending
- Archive/mark-as-read on dismiss

## Sprint 11: Google Calendar Connector (v1)
**Priority:** P2 — Second connector
- Calendar OAuth2 (reuse Google auth)
- Upcoming events → green gummies
- Flick to RSVP / reschedule / set reminder
- New event creation via bot chat

## Sprint 12: Achievements System
**Priority:** P3 — Engagement depth
- Achievement definitions ("Inbox Zero", "Week Warrior", "Automation Master", etc.)
- Unlock animations
- Achievement gallery/trophy case screen
- Progress indicators for in-progress achievements

## Sprint 13: Sound & Haptic Packs
**Priority:** P3 — Monetization
- Multiple sound themes (default, nature, retro, sci-fi)
- Custom haptic patterns per theme
- Preview before purchase
- IAP integration (Expo IAP or RevenueCat)

## Sprint 14: Bot Skins Store
**Priority:** P3 — Monetization
- Skin gallery with previews
- IAP purchase flow
- Equipped skin persistence
- Seasonal/limited skins framework

---

*Backlog created: 2026-03-27 | Source: docs/idea.md + market-research.md*

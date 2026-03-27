# Sprint 8 Contract: XP, Levels & Streaks

## What Will Be Built
Server-side gamification: XP per task completion, level progression, daily streaks, combo multiplier. Displayed in both clients.

## Acceptance Criteria
1. Go: XP awarded on task completion (base XP * complexity * combo multiplier)
2. Go: Level thresholds (100, 300, 600, 1000, 1500... geometric progression)
3. Go: Daily streak tracking (increment if completed today, reset if gap)
4. Go: Combo multiplier (3+ completions within 30 seconds = 2x, 5+ = 3x)
5. Go: WebSocket broadcast of XP/level/streak changes
6. Go: GET /api/users/{id}/stats returns full gamification state
7. Web: Status bar showing level, XP progress bar, streak
8. Mobile: StatusHeader updated to show real data from server

## Verification
- Complete task → XP increases → broadcast to clients
- Level up at correct thresholds
- Streak increments daily, resets on gap

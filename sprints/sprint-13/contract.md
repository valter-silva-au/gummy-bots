# Sprint 13 Contract — Achievements System

## Feature
Achievement definitions, unlock tracking, unlock animations, and trophy case display.

## Acceptance Criteria
1. Go: Achievement model + definitions (Inbox Zero, Week Warrior, Speed Demon, etc.)
2. Go: Progress tracking per user in SQLite
3. Go: Check + unlock endpoint, WebSocket broadcast on unlock
4. Web: Achievement unlock animation (toast/overlay)
5. Web: Trophy case panel (keyboard shortcut to toggle)

## Technical Approach
- Server: `Achievement` model in store, `AchievementDef` with conditions
- Server: `POST /api/gummies/{id}/execute` checks achievement conditions after XP award
- Server: `GET /api/users/{id}/achievements` returns unlocked + progress
- Server: WebSocket `achievement:unlocked` event
- Web: Achievement overlay in renderer (golden banner animation)
- Web: Trophy panel toggled with 'T' key, renders as canvas overlay

## Achievement Definitions
| ID | Name | Condition |
|----|------|-----------|
| inbox_zero | Inbox Zero | Clear all gummies in one session |
| first_catch | First Catch | Execute your first task |
| speed_demon | Speed Demon | Catch 3 gummies in 10 seconds |
| week_warrior | Week Warrior | 7-day streak |
| level_10 | Rising Star | Reach level 10 |
| level_25 | Power User | Reach level 25 |
| combo_master | Combo Master | Reach 5x combo multiplier |
| century | Century | Earn 100+ XP in one action |

## Out of Scope
- Mobile app achievements UI
- Persistent cross-session streak-based achievements (simplified to single-session checks)

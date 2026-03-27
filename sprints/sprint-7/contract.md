# Sprint 7 Contract: Bot Personality & States

## What Will Be Built
Four distinct bot states with smooth transitions and visual feedback, synced via WebSocket.

## States
1. **Idle**: Gentle breathing pulse + soft cyan glow
2. **Thinking**: Faster pulse + rotating particles around orb + yellow tint
3. **Working**: Active spin animation + bright glow + processing dots
4. **Celebrating**: Sparkle burst + color pulse + expanded glow

## Acceptance Criteria
1. Go: Bot state model (idle/thinking/working/celebrating) with WebSocket broadcast
2. Web: Four visually distinct bot states rendered on canvas
3. Web: Smooth transitions between states (no jarring switches)
4. Mobile: Bot states reflected in BotOrb component
5. State transitions: idle → thinking (when gummy in-flight) → working (executing) → celebrating (done) → idle

## Verification
- Bot visually changes when processing a task
- Celebration is clearly different from idle
- States transition smoothly

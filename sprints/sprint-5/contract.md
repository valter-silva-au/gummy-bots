# Sprint 5 Contract: Task & Gummy Pipeline

## What Will Be Built
End-to-end pipeline: create task → auto-generate gummy with category color → broadcast via WebSocket → both clients render in orbit → flick triggers execution → status update broadcast.

## Acceptance Criteria
1. Go: Task creation auto-generates gummy with correct color/size/orbit based on category and complexity
2. Go: WebSocket broadcasts gummy:new, gummy:executed, gummy:dismissed events
3. Go: Flick endpoint triggers Bedrock executor agent (if configured) and returns result
4. Mobile: Receive gummies from WebSocket and add to orbit
5. Web: Receive gummies from WebSocket and add to orbit
6. Both: Flick sends execute request to server
7. Category → color mapping: comms=#4a90ff, calendar=#44cc66, info=#ff8833, urgent=#ff4455, automation=#aa66ff

## Verification
- POST task → gummy appears on web and mobile
- Flick gummy → server processes → done toast/particle

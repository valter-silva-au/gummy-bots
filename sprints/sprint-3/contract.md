# Sprint 3 Contract: Mobile App Physics Polish

## What Will Be Built
Enhanced flick physics with magnetic snapping, gravity wells, improved catch animations, and WebSocket client connecting to the Go server.

## Acceptance Criteria
1. Magnetic gravity well around bot — imprecise flicks still get caught within generous radius
2. Momentum-based flick with inertia — faster flicks travel further
3. Bot catch animation: squish effect + absorb glow pulse + color flash from gummy
4. Gummy miss: bounce off screen edge with damping, drift back to orbit
5. Smooth deceleration curves (ease-out) on all physics movements
6. WebSocket client that connects to Go server and handles reconnection
7. 60fps animations (no jank)

## Verification
- Flick toward bot center with varying accuracy — all should catch within ~120px radius
- Bot visually reacts to catches (squish, glow)
- Missed gummies drift back naturally
- WebSocket connection established on app load

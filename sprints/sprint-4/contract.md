# Sprint 4 Contract: React Web App

## What Will Be Built
A React + Vite + TypeScript web app with Canvas renderer for the bot + gummies, mouse drag flick, WebSocket connection to Go server, and dark game aesthetic.

## Acceptance Criteria
1. Vite + React + TypeScript project in `web/`
2. Canvas renderer: bot orb at center with breathing animation + glow
3. Gummies orbiting bot with smooth rotation
4. Mouse drag = flick: drag toward center = catch, drag away = dismiss
5. Bot catch animation (squish + flash)
6. Particle burst on gummy pop
7. WebSocket connection to Go server
8. Dark theme (#0a0a1a) matching mobile
9. Responsive layout (desktop + tablet)
10. `npm run dev` starts on port 5173

## Verification
- `npm run dev` runs, page loads with dark background
- Bot renders at center with breathing glow
- Gummies orbit and can be flicked
- Particle effects on catch

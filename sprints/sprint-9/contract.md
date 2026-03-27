# Sprint 9 Contract: Gummy Orbit System

## Goal
Enhance the orbit system with priority-based orbital speeds, smooth gummy entry animations, and overflow handling.

## Scope
- Modify orbit physics to reflect task priority/urgency
- Add smooth scale-in animation for new gummies
- Cap visible gummies at 8, show overflow count
- Improve label readability

## Acceptance Criteria

### 1. Priority-Based Orbital Speed
**Given** multiple gummies with different priorities exist
**When** they orbit the bot
**Then** urgent/high-priority gummies orbit visibly faster than low-priority ones

### 2. Smooth Entry Animation
**Given** a new gummy is created
**When** it appears in the orbit field
**Then** it scales from 0 to 1 over 0.3 seconds with smooth easing

### 3. Overflow Management
**Given** more than 8 gummies exist
**When** the canvas renders
**Then** only 8 gummies are visible and an overflow indicator shows "+ N more"

### 4. Readable Labels
**Given** gummies of various sizes
**When** rendered on canvas
**Then** labels scale proportionally and remain readable

## Files Changed
- `web/src/engine/physics.ts` — orbit speed, entry animation
- `web/src/engine/renderer.ts` — overflow indicator, label scaling
- `web/src/engine/types.ts` — entry timestamp tracking (if needed)

## Out of Scope
- Mobile app changes (already has good animations)
- Backend changes
- Gesture handling (Sprint 10)

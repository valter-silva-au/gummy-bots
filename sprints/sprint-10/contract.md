# Sprint 10 Contract: Gesture Refinement

## Goal
Add tap-to-show-tooltip and long-press gestures to the web app for better gummy inspection.

## Scope
- Detect tap (mousedown + mouseup without significant drag)
- Show tooltip card on tap with gummy details
- Detect long press (mousedown > 500ms)
- Mobile app already has good gestures from Sprint 3

## Acceptance Criteria

### 1. Tap Detection
**Given** user clicks on a gummy without dragging
**When** mouse is released within 200ms and < 200px movement
**Then** a tooltip appears near the gummy showing its label and details

### 2. Tooltip Display
**Given** a gummy is tapped
**When** the tooltip renders
**Then** it shows gummy title, priority, and complexity in a styled card

### 3. Long Press Detection
**Given** user holds mousedown on a gummy for > 500ms
**When** long press threshold is reached
**Then** system recognizes it (future: could show expanded details)

### 4. Tooltip Dismissal
**Given** a tooltip is visible
**When** user clicks elsewhere or starts dragging
**Then** tooltip disappears smoothly

## Files Changed
- `web/src/engine/physics.ts` — `tapGummy()` function
- `web/src/engine/types.ts` — tooltip state
- `web/src/engine/renderer.ts` — `drawTooltip()` rendering
- `web/src/components/GameCanvas.tsx` — gesture detection logic

## Out of Scope
- Mobile app changes (gestures already good)
- Backend changes
- Tooltip styling beyond basic readability

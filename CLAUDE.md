# CLAUDE.md — Gummy Bots Project Context

## Project Overview
**Gummy Bots** — A gamified AI assistant mobile app where users flick task bubbles at a central AI bot.
- **Repo:** https://github.com/valter-silva-au/gummy-bots
- **Stack:** Expo (React Native), TypeScript, Reanimated, Gesture Handler, Skia
- **Status:** Early prototype — physics flick mechanic demo

## Architecture

### Frontend (gummy-bots-app/)
- Expo SDK with TypeScript
- React Native Reanimated for 60fps animations
- React Native Gesture Handler for flick mechanics
- Expo Haptics for tactile feedback
- Dark theme (#0a0a1a background)

### Components
- `BotOrb.tsx` — Central glowing AI bot with breathing animation
- `GummyField.tsx` — Orbiting task bubbles with physics + pan gesture flick
- `StatusHeader.tsx` — Level + streak display
- `ConnectorDock.tsx` — Bottom row of integration icons
- `DoneToast.tsx` — Task completion feedback

### Key Concepts
- **Bot** = central orb that "catches" tasks
- **Gummies** = color-coded task bubbles (🔵comms 🟢calendar 🟠info 🔴urgent 🟣automation)
- **Flick** = pan gesture toward bot = execute task; away = dismiss
- **Connectors** = OAuth2 integrations that feed gummies (Gmail, Calendar, Slack)

## Code Standards
- TypeScript strict mode
- Functional components with hooks
- Reanimated shared values for animations
- Gesture Handler v2 API
- No class components
- Descriptive variable names (`isGummyCaptured` not `cap`)

## Design Principles
1. **Physics engine is the moat** — over-invest in feel, inertia, collision
2. **The flick IS the security gate** — no flick = no execution (human-in-the-loop)
3. **Edge AI first** — triage on-device, cloud only for complex drafts
4. **Zero cognitive overhead** — no menus, no forms, spatial + color = instant parsing
5. **ASMR feedback loop** — visual pop + audio + haptic on every completion

## Security Architecture
- Read-only monitoring agent (generates gummies, never executes)
- Separate execution agent (only acts on explicit flick authorization)
- No WhatsApp integration (Meta 2026 ban on general-purpose AI bots)
- Isolated user embeddings (no multi-tenant vector DB)
- Zero-retention cloud API endpoints

## File Structure
```
gummy-bots/
├── CLAUDE.md              ← You are here
├── README.md
├── docs/
│   ├── idea.md            ← Full product vision
│   └── market-research.md ← Deep market & feasibility analysis
├── memory-bank/
│   ├── project-brief.md   ← Core requirements and goals
│   ├── active-context.md  ← Current work focus and recent changes
│   ├── progress.md        ← What's done, what's next
│   └── decisions.md       ← Architecture decisions and rationale
└── gummy-bots-app/        ← Expo prototype
    ├── App.tsx
    ├── src/components/
    └── ...
```

## Memory Bank
Read `memory-bank/*.md` at the start of every session for persistent context.
Update `memory-bank/active-context.md` and `memory-bank/progress.md` after significant changes.

## Commands
```bash
# Run the app
cd gummy-bots-app && npx expo start

# Install deps
cd gummy-bots-app && npm install
```

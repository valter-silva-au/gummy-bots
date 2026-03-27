# CLAUDE.md — Gummy Bots Project Context

## Project Overview
**Gummy Bots** — A gamified AI assistant where users flick task bubbles at a central AI bot.
- **Repo:** https://github.com/valter-silva-au/gummy-bots
- **Status:** Full-stack local-first build in progress

## Architecture — LOCAL FIRST, NO CLOUD

Everything runs locally. No cloud services, no SaaS dependencies.

### Backend (server/)
- **Go** — high-performance local API server
- WebSocket server for real-time gummy updates
- LLM integration via **Amazon Bedrock API Key** (environment variable `AWS_BEARER_TOKEN_BEDROCK`)
- SQLite for local persistence (user data, tasks, XP, streaks)
- Agent orchestration: monitor agent (read-only) → executor agent (flick-triggered)
- OAuth2 connector framework (Gmail, Calendar, Slack)

### Frontend — Mobile (gummy-bots-app/)
- Expo SDK with TypeScript (iOS + Android)
- React Native Reanimated for 60fps animations
- React Native Gesture Handler for flick mechanics
- React Native Skia for custom rendering
- Expo Haptics for tactile feedback
- Dark theme (#0a0a1a background)
- Connects to local Go server via WebSocket

### Frontend — Web (web/)
- React + Vite + TypeScript
- Same dark game aesthetic
- Canvas/WebGL for physics rendering
- Web Audio API for ASMR sounds
- WebSocket connection to local Go server
- For local testing and demo purposes

### LLM Configuration
```
Provider: Amazon Bedrock (API Key auth)
Models:
  - Primary: us.anthropic.claude-opus-4-6-v1 (complex task execution)
  - Fast: us.anthropic.claude-sonnet-4-6-v1 (triage, categorization)
Region: us-west-2
Auth: AWS_BEARER_TOKEN_BEDROCK environment variable
NO external API calls except Bedrock
```

## Components (Mobile)
- `BotOrb.tsx` — Central glowing AI bot with breathing animation
- `GummyField.tsx` — Orbiting task bubbles with physics + pan gesture flick
- `StatusHeader.tsx` — Level + streak display
- `ConnectorDock.tsx` — Bottom row of integration icons
- `DoneToast.tsx` — Task completion feedback

## Key Concepts
- **Bot** = central orb that "catches" tasks
- **Gummies** = color-coded task bubbles (🔵comms 🟢calendar 🟠info 🔴urgent 🟣automation)
- **Flick** = pan gesture toward bot = execute task; away = dismiss
- **Connectors** = OAuth2 integrations that feed gummies (Gmail, Calendar, Slack)

## Code Standards
- **Go:** idiomatic Go, `go fmt`, error handling with explicit returns, no panics
- **TypeScript:** strict mode, functional components, no `any` types
- Reanimated shared values for animations
- Gesture Handler v2 API
- Descriptive variable names (`isGummyCaptured` not `cap`)

## Design Principles
1. **LOCAL FIRST** — everything runs on the dev machine, no cloud except Bedrock for LLM
2. **Go for speed** — backend must be fast, sub-10ms response times for local operations
3. **Physics engine is the moat** — over-invest in feel, inertia, collision
4. **The flick IS the security gate** — no flick = no execution (human-in-the-loop)
5. **Zero cognitive overhead** — no menus, no forms, spatial + color = instant parsing
6. **ASMR feedback loop** — visual pop + audio + haptic on every completion

## Security Architecture
- Read-only monitoring agent (generates gummies, never executes)
- Separate execution agent (only acts on explicit flick authorization)
- No WhatsApp integration (Meta 2026 ban)
- All data stored locally in SQLite
- LLM calls go to Bedrock only (no data training)

## File Structure
```
gummy-bots/
├── CLAUDE.md              ← You are here
├── README.md
├── docs/
│   ├── idea.md            ← Full product vision
│   ├── market-research.md ← Deep market & feasibility analysis
│   └── harness.md         ← Development harness (3-agent sprint workflow)
├── memory-bank/
│   ├── project-brief.md   ← Core requirements and goals
│   ├── active-context.md  ← Current work focus and recent changes
│   ├── progress.md        ← What's done, what's next
│   └── decisions.md       ← Architecture decisions and rationale
├── sprints/
│   ├── backlog.md         ← Ordered feature backlog
│   └── sprint-{N}/       ← Per-sprint contracts, evaluations, feedback
├── server/                ← Go backend
│   ├── main.go
│   ├── go.mod
│   ├── internal/
│   │   ├── api/           ← HTTP + WebSocket handlers
│   │   ├── agent/         ← LLM agent orchestration (monitor + executor)
│   │   ├── connector/     ← OAuth2 connectors (Gmail, Calendar, Slack)
│   │   ├── store/         ← SQLite persistence
│   │   └── physics/       ← Server-side task prioritization logic
│   └── ...
├── web/                   ← React web app
│   ├── src/
│   ├── vite.config.ts
│   └── ...
└── gummy-bots-app/        ← Expo mobile app
    ├── App.tsx
    ├── src/components/
    └── ...
```

## Memory Bank
Read `memory-bank/*.md` at the start of every session for persistent context.
Update `memory-bank/active-context.md` and `memory-bank/progress.md` after significant changes.

## Development Harness (IMPORTANT)
Read `docs/harness.md` before starting any feature work. It defines a 3-agent sprint workflow:

1. **Plan** — pick next feature from `sprints/backlog.md`
2. **Contract** — write `sprints/sprint-{N}/contract.md` with acceptance criteria
3. **Build** — implement one feature, commit with git
4. **Evaluate** — grade against 5 criteria (physics feel, visual design, originality, craft, functionality)
5. **Iterate** — if any score < 6/10, fix and re-evaluate before moving on

Key rules:
- One feature per sprint. No scope creep.
- Physics feel, visual design, and originality are weighted HIGH — push beyond safe/generic.
- Communicate via files in `sprints/` directory.
- Commit after each completed sprint.
- Update memory-bank after each sprint.

## Commands
```bash
# Backend (Go)
cd server && go run .

# Mobile app
cd gummy-bots-app && npx expo start

# Web app
cd web && npm run dev

# All together (use separate terminals or tmux)
# Terminal 1: cd server && go run .
# Terminal 2: cd gummy-bots-app && npx expo start
# Terminal 3: cd web && npm run dev
```

## Environment
```
Go: 1.22.2
Node: 22.22.1
Claude Code: 2.1.85 (Bedrock)
OS: Linux x86_64
LLM: Bedrock API Key auth (us-west-2)
```

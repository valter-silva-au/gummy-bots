# Development Harness — Gummy Bots

> Based on Anthropic's "Harness design for long-running application development"
> https://www.anthropic.com/engineering/harness-design-long-running-apps

## Architecture: 3-Agent System

### 1. Planner
- Takes the product spec (`docs/idea.md` + `memory-bank/project-brief.md`) and breaks it into sprint-sized features
- Focuses on **product context and high-level technical design**, NOT granular implementation details
- Outputs a sprint backlog to `sprints/backlog.md`
- Each sprint = one feature, clearly scoped

### 2. Generator
- Picks up one sprint at a time from the backlog
- Before coding: writes a **sprint contract** (`sprints/sprint-{N}/contract.md`) defining:
  - What will be built
  - Acceptance criteria
  - How success will be verified
- Implements the feature, commits with git after each sprint
- Self-evaluates before handing off to the evaluator
- On evaluator failure: reads feedback, iterates (refine or pivot)

### 3. Evaluator
- Receives the sprint contract + running app
- Tests the implementation by actually interacting with it (Expo web preview or screenshots)
- Grades against criteria (see below)
- Each criterion has a **hard threshold** — if any falls below, sprint fails
- Writes detailed feedback to `sprints/sprint-{N}/evaluation.md`
- Generator must address all failures before moving to next sprint

## Grading Criteria

Each criterion scored 1-10. **Minimum threshold: 6**. Sprint fails if any score < 6.

### 1. Physics Feel (weight: HIGH)
- Does the flick feel satisfying? Momentum, inertia, collision response?
- Is there magnetic assist / gravity wells so imprecise flicks still register?
- Do gummies orbit smoothly at 60fps?
- Does the bot react believably to catches?

### 2. Visual Design (weight: HIGH)
- Does the design feel cohesive, not like assembled parts?
- Is there a distinct mood/identity (dark game aesthetic, not generic)?
- Are there deliberate creative choices, or is it AI slop (purple gradients on white cards)?
- Color-coded gummies are instantly distinguishable?

### 3. Originality (weight: HIGH)
- Would a human designer recognize intentional choices?
- Does it feel like a game, not a productivity app with colors?
- Any novel visual or interaction ideas beyond the spec?

### 4. Craft (weight: MEDIUM)
- Typography hierarchy, spacing consistency, color harmony
- Contrast ratios meet accessibility standards
- Animations don't jank, no layout shifts
- Code is clean TypeScript, no `any` types

### 5. Functionality (weight: MEDIUM)
- Can users understand what to do without instructions?
- Gestures work reliably (no phantom catches, no missed flicks)
- State management is correct (gummy disappears after catch, toast shows, XP updates)
- No crashes, no unhandled errors

## Sprint Workflow

```
1. PLAN: Read backlog → pick next feature
2. CONTRACT: Write sprint contract → agree on "done" definition
3. BUILD: Implement one feature at a time, commit after each
4. SELF-EVAL: Generator checks own work honestly
5. EVALUATE: Evaluator tests the running app, scores each criterion
6. ITERATE: If any score < 6, generator gets feedback → fix → re-evaluate
7. SHIP: All scores ≥ 6 → update progress.md → move to next sprint
```

## File-Based Communication

Agents communicate through files, not conversation:

```
sprints/
├── backlog.md                    ← Planner output: ordered feature list
├── sprint-1/
│   ├── contract.md               ← Generator proposes, evaluator agrees
│   ├── evaluation.md             ← Evaluator scores + feedback
│   ├── iteration-1-feedback.md   ← If sprint failed, detailed fix notes
│   └── iteration-2-feedback.md   ← Subsequent iterations if needed
├── sprint-2/
│   ├── contract.md
│   └── evaluation.md
└── ...
```

## Context Management

- **One feature per sprint** — prevents scope drift
- **Compaction over resets** for Opus models (no context anxiety)
- **Memory bank updates** after each completed sprint (`memory-bank/active-context.md`, `memory-bank/progress.md`)
- **Git commit after each sprint** — clean rollback points
- **Sprint contracts prevent cascading errors** — agree on "done" before writing code

## Key Principles from Anthropic's Research

1. **Separate builder from judge** — agents praise their own work. A separate evaluator catches real bugs.
2. **Evaluator must be skeptical** — calibrate toward criticism, not praise. It's easier to tune a standalone evaluator to be tough than to make a generator critical of itself.
3. **Sprint contracts before code** — bridge the gap between user stories and testable implementation.
4. **Physics feel and originality weighted highest** — Claude already does craft and functionality well by default. Push hard on what it normally gets wrong (generic, safe, bland).
5. **Iterate or pivot** — if scores trend well, refine. If approach isn't working, pivot to a different direction entirely.
6. **File-based handoffs** — agents read/write files to communicate state, not conversation history.

# Gummy Bots 🫧

> *Flick tasks at your AI bot like a billiards game.*

---

## The Problem

Task management is boring. Every productivity app is the same — lists, checkboxes, kanban boards. They work, but they don't *feel* like anything. Nobody opens Todoist for fun.

Meanwhile, your daily life generates a stream of small tasks: reply to that email, book the dentist, check the calendar, send the invoice. You know what to do — you just need something to *do it*.

Existing gamified productivity apps (Habitica, Finch, Forest) gamify **tracking** — you still do the work yourself, then check a box to get your dopamine hit. The game layer is bolted on top of a to-do list. The $30B+ productivity market (growing 17%+ YoY) is ripe for something fundamentally different.

## The Idea

**Gummy Bots** gamifies **execution**, not tracking. This is the paradigm shift.

You open the app and see your **Bot** — a glowing orb at the center of the screen. Around it, colorful **Gummies** (task bubbles) orbit gently. Each gummy is an action: "Reply to Mom", "Book dentist appointment", "Send daily news digest".

You **flick** a gummy at the bot — like shooting a marble in a street game of bilhar. The bot catches it, executes the task, and you hear a satisfying *pop*. Done. Next.

The inspiration comes from **gude/bilhar** — the street marble games played in Brazil and the Middle East. Kids flick marbles at targets with precision and flair. That tactile, physical feeling — aim, flick, hit — is what Gummy Bots brings to task management.

**One sentence:** *The app shifts productivity software from "digital ledger" to "proxy worker" — you aim, you flick, the bot does the work.*

## Competitive Landscape

| App | Gamifies... | User still does the work? | Friction |
|-----|-------------|--------------------------|----------|
| **Habitica** | Tracking (RPG) | Yes — high cognitive overhead maintaining the RPG itself | High |
| **Todoist** | Tracking (Karma/streaks) | Yes — text lists, manual entry | Minimal |
| **Finch** | Emotional check-in (pet) | Yes — focus on mood, not execution | Low |
| **Forest** | Focus time (trees) | Yes — passive timer | Minimal |
| **Gummy Bots** | **Execution** (physics) | **No — the bot does it** | Minimal |

Gummy Bots is the only app where the gamification mechanic *is* the task execution. The flick isn't a reward for doing work — the flick **is** doing the work.

## How It Works

### The Bot (Center of Screen)
Your personal AI assistant lives at the center. It breathes, glows, and reacts. When idle, it pulses gently. When working, it spins. When it completes a task, it celebrates.

The bot is powered by an LLM that understands your tasks and executes them through connected services. The flick gesture serves as **explicit human authorization** — the bot never acts without your deliberate physical input, solving the AI autonomy anxiety problem elegantly.

### Gummies (Task Bubbles)
Tasks appear as colorful bubbles orbiting the bot:

- **🔵 Blue** — Communication (emails, messages, replies)
- **🟢 Green** — Scheduling (calendar, appointments, reminders)
- **🟠 Orange** — Information (news, weather, lookups)
- **🔴 Red** — Urgent (overdue, flagged items)
- **🟣 Purple** — Automation (recurring workflows)

**Size = effort/complexity** (small = quick, large = multi-step).
**Distance from center = priority** (close = urgent, far = backlog).

The brain processes spatial positioning and color faster than it reads text. Users parse their entire workload at a glance — no scrolling, no list fatigue. This spatial categorization is particularly powerful for neurodivergent users (ADHD) who get overwhelmed by text-heavy interfaces.

Gummies appear automatically from your **connectors** — integrations with Gmail, Google Calendar, and more. The bot watches your feeds and surfaces tasks as gummies you can act on.

### The Flick (Core Interaction)

The magic is in the gesture:

- **Flick toward the bot** → Execute the task. Bot catches it, does the work.
- **Flick away from the bot** → Dismiss or snooze. The gummy drifts away.
- **Quick flick** → "Just do it" — the bot decides the best action.
- **Long press + flick** → Opens a detail panel first so you can customize before sending.
- **Tap a gummy** → Preview what the task is about.
- **Tap the bot** → Open chat/voice mode to create a custom task.

The physics must feel *real* — momentum, weight, satisfying catch animations. Research on "Newtonian interfaces" shows that digital objects exhibiting believable physical characteristics dramatically increase engagement. The engine should secretly use **magnetic snapping** and **gravity wells** around the bot so even hasty flicks register as hits — maintaining the illusion of skill without punishing imprecision.

### The Multisensory Dopamine Loop

The moment of task completion triggers a triple-sensory reward:

1. **Visual** — gummy bursts/pops with particles
2. **Auditory** — satisfying ASMR-style pop sound
3. **Haptic** — precise tactile vibration via modern smartphone actuators

Studies show this combination triggers an autonomous sensory meridian response (ASMR) that actively reduces stress. For an app dealing with inherently stressful task management, transforming completion into a calming, satisfying sensory reward is the psychological hook that drives daily habit formation.

### Connectors (Data Feeds)

The bot feeds on your integrations. Connectors stream data in from the edges of the screen:

**v1 Launch connectors:**
- 📧 Gmail — read, reply, archive, compose
- 📅 Google Calendar — view, create, reschedule, RSVP
- ⏰ Reminders — set, snooze, complete
- 📰 News/RSS — daily digest, save articles
- 💬 Slack — read, quick reply

**v2+:**
- Microsoft Teams, Discord, Notion
- Uber/ride-hailing ("Book a ride home")
- Banking notifications
- Smart home controls

> ⚠️ **WhatsApp is excluded from the roadmap.** Meta's 2026 policy explicitly bans general-purpose AI assistants on the WhatsApp Business API. Unofficial workarounds (browser scraping, accessibility exploits) risk permanent user account bans and are technically unstable. We launch with open-ecosystem APIs only.

## The Flick as Security Gate

A critical insight: the flick mechanic isn't just fun — it's a **security architecture decision**.

The biggest threat to any email-reading AI agent is **indirect prompt injection** — a malicious email containing hidden instructions that trick the LLM into exfiltrating data or taking unauthorized actions. The standard defense is "human-in-the-loop" authorization.

Gummy Bots solves this *by design*:

- A **read-only monitoring agent** scans your feeds and generates gummies (never executes)
- A **separate execution agent** can only act when the user physically flicks a gummy
- **No flick = no action** — the physical gesture IS the authorization gate
- **Long press** lets users inspect exactly what the bot will do before authorizing

This means the core game mechanic doubles as a security boundary. The app can't be tricked into acting autonomously because the human must always physically initiate execution.

## Privacy Architecture

- **Edge AI first** — triage, categorization, and summarization happen on-device using the phone's neural engine
- **Cloud only for complex drafts** — routed through zero-retention enterprise API endpoints
- **No training on user data** — explicit contractual guarantees
- **End-to-end encryption** for stored context
- **No multi-tenant vector DB** — user embeddings are isolated and encrypted (vector embeddings can be reverse-engineered)

## Gamification

This isn't a gimmick — gamification drives daily engagement:

- **XP & Levels** — earn XP per completed task, level up your bot
- **Bot Evolution** — your bot visually evolves as you level up (simple orb → detailed character → custom skins)
- **Streaks** — daily completion streaks (3-day, 7-day, 30-day)
- **Combos** — complete 3+ tasks rapidly for a multiplier
- **Achievements** — "Inbox Zero", "Week Warrior", "Automation Master"
- **Power-ups** — "Batch Mode" (flick multiple at once), "Auto-pilot" (bot handles all suggestions for 1 hour)

Key difference from Habitica: the gamification layer requires **zero maintenance**. No stat allocation, no menu navigation, no RPG management overhead. The game IS the productivity — there's no separation.

## User Flow

```
1. Open app → Bot greets you, gummies orbit around it
2. New gummy appears from Gmail connector → "Reply to Mom"
3. You flick it at the bot
4. Bot catches it → typing animation → reply sent
5. Gummy pops → "✓ Done" toast → XP gained
6. Streak counter updates → dopamine hit → next task
```

## Screen Layout

```
┌─────────────────────────────┐
│  ⚡ Level 7    🔥 5-day     │  ← Status bar
│                              │
│     🟠          🔵           │
│         🟢                   │  ← Orbiting gummies
│    🔵      🤖      🟣       │  ← Bot center
│         🔴                   │
│     🟢          🟠           │
│                              │
│  ┌──────────────────────┐   │
│  │ 📧 Gmail  📅 Cal  💬 │   │  ← Connector dock
│  └──────────────────────┘   │
└─────────────────────────────┘
```

## Technical Stack

- **Frontend:** React Native / Expo (iOS + Android)
- **Physics/Rendering:** React Native Reanimated + Skia (60fps, the primary competitive moat)
- **Gestures:** React Native Gesture Handler (flick mechanics with magnetic assist)
- **Haptics:** Expo Haptics (rich actuator feedback)
- **On-device AI:** Core ML / NNAPI for triage and categorization
- **Backend:** LLM-powered agentic engine (multi-agent: monitor → orchestrator → executor)
- **Integrations:** OAuth2 connectors (Google, Slack, Notion, etc.)
- **Real-time:** WebSocket for live gummy updates
- **Auth:** Google / Apple SSO

### Why the physics engine is the moat

AI agents will commoditize. LLMs will get cheaper and more capable. What won't be easy to clone is the *feel* — the exact inertia, collision detection, haptic resonance, and visual satisfaction of the flick. This is the primary competitive moat and the viral marketing engine (TikTok screen recordings of satisfying flicks).

## Business Model

| Tier | Revenue Driver | Details |
|------|---------------|---------|
| **Free** | Cosmetic IAP | 3 connectors, core mechanics, standard bot |
| **Pro** | $9.99/mo subscription | Unlimited connectors, advanced automations, priority processing |
| **Bot Skins** | One-time IAP ($1.99-$4.99) | Cyberpunk, minimal, retro, seasonal — drives emotional attachment via IKEA effect |
| **Sound Packs** | One-time IAP ($0.99-$2.99) | Custom ASMR pop sounds and haptic patterns |
| **Team Mode** | Per-seat ($14.99/seat/mo) | Shared delegation, org-wide bot swarms, flick tasks to teammates |

The cosmetic microtransaction market is projected to reach $220B by 2037. Bot skins avoid "pay-to-win" stigma — free users get the full experience, revenue comes from personalization whales.

> ⚠️ **Team Mode requires SOC2/GDPR compliance** — earmarked for v3+ after core product-market fit is validated.

## Why This Works

1. **Novel interaction model** — nobody else does task-as-physics. Memorable and shareable.
2. **Gamifies execution, not tracking** — the fundamental paradigm shift.
3. **Low friction** — see task, flick task, done. No forms, no dropdowns, no cognitive overhead.
4. **Dual reward system** — micro (tactile pop) + macro (cleared inbox) = powerful habit loop.
5. **Built-in security** — the flick IS the human-in-the-loop authorization. No accidental autonomy.
6. **ADHD-friendly** — spatial UI, color coding, no text walls, satisfying sensory feedback.
7. **Viral potential** — the flick mechanic is visually compelling in screen recordings / TikTok demos.
8. **Physics moat** — the *feel* is hard to clone, even when AI agents commoditize.

## Origin

The idea came from imagining: *what if a productivity app felt like a video game?* Combined with the childhood memory of **bilhar/gude** — Brazilian street marble games where you flick with precision at a target. That physical, tactile joy of aiming and hitting — applied to your daily tasks.

---

*Gummy Bots — because getting stuff done should feel like play.*

*Valter Silva — March 2026*

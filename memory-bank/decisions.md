# Architecture Decisions — Gummy Bots

## ADR-001: No WhatsApp Integration
**Date:** 2026-03-27
**Status:** Accepted
**Context:** Meta's 2026 policy explicitly bans general-purpose AI assistants on WhatsApp Business API. Unofficial workarounds (browser scraping, accessibility exploits) risk permanent user account bans.
**Decision:** Exclude WhatsApp from all roadmap versions. Launch with Gmail, Calendar, Slack, Notion.
**Consequences:** Lose a massive user base connector, but avoid legal/compliance risk and user account bans.

## ADR-002: Flick as Security Gate
**Date:** 2026-03-27
**Status:** Accepted
**Context:** Indirect prompt injection is the #1 threat to email-reading AI agents. A malicious email could hijack the bot.
**Decision:** Separate read-only monitoring agent from execution agent. The physical flick gesture IS the human-in-the-loop authorization. No flick = no action.
**Consequences:** Core game mechanic doubles as security boundary. Can't be tricked into autonomous action.

## ADR-003: Edge AI First
**Date:** 2026-03-27
**Status:** Accepted
**Context:** Users trust personal assistants with sensitive data. Vector embeddings can be reverse-engineered. Third-party LLM APIs may train on user data.
**Decision:** Triage, categorization, and summarization on-device (Core ML / NNAPI). Cloud only for complex draft generation via zero-retention endpoints.
**Consequences:** Higher initial development complexity, but strong privacy story and reduced cloud costs.

## ADR-004: Physics Engine as Primary Moat
**Date:** 2026-03-27
**Status:** Accepted
**Context:** AI agents will commoditize. LLMs get cheaper. The *feel* of the interaction is what's hard to replicate.
**Decision:** Over-invest in React Native Skia + Reanimated physics. Exact inertia, collision, haptic resonance must be flawless.
**Consequences:** Higher frontend engineering investment, but creates defensible differentiation and TikTok-viral visual content.

## ADR-005: Expo / React Native Stack
**Date:** 2026-03-26
**Status:** Accepted
**Context:** Need cross-platform iOS + Android from day one. Solo developer, budget-conscious.
**Decision:** Expo SDK with React Native Reanimated, Gesture Handler, Skia, and Haptics.
**Consequences:** Single codebase, fast iteration, good animation ecosystem. Trade-off: may need native modules for advanced haptics later.

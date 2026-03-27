# YC Office Hours Review — Gummy Bots

**Date:** 2026-03-27
**Founder:** Valter Silva (solo dev, Perth, Australia)
**Stage:** Pre-launch, working prototype (Go + Expo + React web)
**Format:** Full YC partner office hours

---

## 1. REFRAME: What Are You Actually Building?

Valter, let me push back on the pitch. You said "gamified AI assistant where you flick task bubbles." That's the mechanic, not the product.

**What you're actually building is a trust interface for AI agents.**

The entire AI industry has a UX problem: people don't trust autonomous agents to act on their behalf. Every enterprise AI assistant has the same unresolved design question — *how do you let an AI send an email without the user having a panic attack?*

Your flick is not a game mechanic. It's a **consent primitive**. It's a physical, visceral, unambiguous way to say "I authorize this." That's a much bigger idea than "gamified task management."

Stop thinking of this as a productivity app that's fun. Start thinking of it as **the first trust-native interface for AI agents**. The gamification is the spoonful of sugar. The real product is giving humans a physical sense of control over their AI workers.

The reframe matters because it changes your market from "$30B productivity apps" (crowded, dominated by Microsoft/Google) to "trust layer for AI agents" (greenfield, every AI company needs this).

**Your real competitive positioning:** Not Habitica + AI. Not Todoist + agents. It's **the control surface that makes AI agents feel safe.**

---

## 2. CHALLENGE PREMISES

### Challenge 1: Is physics-as-moat real? Can someone clone the feel in a week?

**Verdict: Partially real, but weaker than you think.**

A competent React Native dev with Reanimated experience can replicate your spring physics, magnetic snapping, and particle effects in 3-5 days. The code in `GummyField.tsx` uses standard Reanimated `withSpring`/`withTiming` primitives — there's no proprietary physics engine, no custom native modules, no shader programs. The "feel" comes from well-tuned constants (`BOT_GRAVITY_WELL: 120`, `VELOCITY_THRESHOLD: 300`, `damping: 8, stiffness: 100`), which are discoverable through trial and error.

**What IS hard to clone:**
- The accumulated micro-decisions across 14 sprints of iteration (your sprint harness is actually your secret weapon here)
- The *combination* of physics + haptics + audio + visual pop as a unified sensory experience
- The "catch" interaction having three modes (direct hit, gravity assist, power flick) — this takes playtesting to get right

**What you should do:** The physics alone is not a moat. The moat is the *system* — physics + audio + haptics + connectors + agent trust model. Stop marketing the physics engine. Start marketing the agent trust model. The physics is what makes it delightful; the trust model is what makes it defensible.

### Challenge 2: Will people actually use a game UI for real productivity?

**Verdict: Unvalidated and risky.**

Habitica proved that ~1M users will gamify task *tracking*. But tracking is low-stakes — the worst that happens if the RPG bugs out is you lose fake XP. Your app gamifies *execution* — the bot sends real emails, books real appointments. The consequences of a misflick or a misclassified gummy are real.

**The tension:** Games reward speed and flow state. Productivity requires accuracy and caution. When a user is in "game mode" rapidly flicking gummies for combo multipliers, they may authorize an email reply they should have reviewed first. Your 3x combo multiplier at 5 rapid completions *actively incentivizes* careless authorization.

**What you should validate:**
1. Run a usability test with 5 real users. Give them a mix of safe tasks ("archive this newsletter") and risky tasks ("reply to your boss"). See if the game mechanic causes them to authorize things they shouldn't.
2. Consider visual differentiation for risky tasks — make urgent/high-stakes gummies physically larger, harder to flick, requiring a long-press preview before execution.
3. The ADHD angle is compelling but needs user interviews. Talk to 10 ADHD users. Do they want faster task *initiation* (your value prop) or better task *prioritization* (a different product)?

### Challenge 3: Is local-first the right call or does it limit distribution?

**Verdict: Wrong for the product, right for the prototype.**

Local-first makes sense for your current stage: you're a solo dev iterating fast, you don't want to manage infrastructure, and you're using Bedrock which is already cloud-side. But local-first as a *product strategy* has serious problems:

**Distribution killers:**
- Users can't try the app without installing a Go server. Your funnel is: App Store download → realize you need a local server → install Go → configure Bedrock tokens → hope it works. You'll lose 95% of users at step 2.
- No sync between devices. Mobile is your primary target but the server runs on the dev machine.
- No viral mechanics. Users can't share their bot, show their level, or compete on leaderboards.
- Team Mode (your B2B revenue tier) is architecturally impossible with local-first.

**What you should do:**
- **Now:** Keep local-first for development. It's the right call for speed.
- **At launch:** Deploy the Go server as a hosted service. It's a simple stateless API + SQLite that can run on a single Fly.io instance for ~$5/mo per user.
- **Privacy story:** "Your data is encrypted and never used for training" is achievable with a hosted service. You don't need local-first for privacy — you need encryption at rest and zero-retention LLM endpoints, which you already have with Bedrock.

### Challenge 4: Bot skins monetization — is this proven outside gaming?

**Verdict: Unproven in productivity, but the economics are favorable.**

Cosmetic monetization is a $220B market in gaming, but there are zero successful examples of cosmetic IAP in a productivity app. Todoist doesn't sell themes. Notion doesn't sell skins. The closest analog is Finch (virtual pet app with cosmetic IAP), which has ~$15M ARR — but Finch is an emotional wellness app, not a productivity tool.

**The bull case:** Your bot has personality (breathing, celebrating, evolving across 4 stages). Users will personalize things they have emotional attachment to. The IKEA effect is real. If users spend 10+ minutes daily flicking gummies at their bot, they'll develop attachment.

**The bear case:** Productivity users are utilitarian. They want the tool to work, not to look pretty. The persona who buys a $4.99 cyberpunk bot skin is probably not the same persona who has 50 unread emails they need triaged.

**What you should do:** Launch with the free/Pro subscription model only. Add cosmetic IAP in v2 once you can measure daily engagement time. If average session length > 5 minutes, skins will monetize. If < 2 minutes, they won't.

### Challenge 5: Solo dev building mobile + web + backend + AI — scope creep?

**Verdict: This is the biggest risk to the project.**

You are simultaneously building:
1. A Go HTTP/WebSocket server with SQLite persistence
2. An Expo React Native app with physics-based gestures
3. A React web app with Canvas rendering and Web Audio
4. A Bedrock LLM integration with dual-agent architecture
5. An OAuth2 connector framework
6. A gamification system (XP, levels, streaks, combos, achievements)
7. Four bot evolution visual stages

That's 7 workstreams. Looking at your codebase, you've built all of them to prototype quality. But "prototype quality" across 7 surfaces is worse than "production quality" on 2 surfaces.

**The math:** You have ~2,500 lines of Go, ~1,700 lines of TypeScript (web), and ~700 lines of TypeScript (mobile) plus complex animations. That's ~5,000 lines of code across 3 platforms with no tests, no CI, and a single developer. Every new feature multiplies across all three surfaces.

**What you should do:** Kill the web app. It's described as "for local testing and demo purposes" in your CLAUDE.md. The mobile app is the product. The web app is diluting your effort. Focus on mobile + backend only.

### Challenge 6: ADHD market angle — is this validated or assumed?

**Verdict: Assumed. Strong hypothesis, zero validation.**

Your market research document mentions ADHD/executive dysfunction multiple times as a primary target demographic. The spatial UI, color coding, and zero-text-wall design are genuinely good accessibility features. But you haven't talked to a single ADHD user.

**The danger:** Building for ADHD without ADHD user research leads to well-intentioned but wrong design decisions. For example:
- The combo system rewards rapid task completion — but ADHD users often hyperfocus and struggle with task *switching*, meaning combos might actually trigger anxiety rather than flow.
- The orbiting gummies are visually stimulating — but for some ADHD users, constant motion is distracting and overwhelming, not calming.
- The "zero cognitive overhead" claim assumes spatial UI is universally easier — but some neurodivergent users strongly prefer lists because spatial interfaces have unpredictable layouts.

**What you should do:** Post in r/ADHD and r/ADHDProductivity with a 2-minute screen recording of the flick mechanic. Ask: "Would you use this?" The responses will either validate your core thesis or redirect your target market. Do this before writing another line of code.

### Challenge 7: WhatsApp ban — does this kill the viral loop?

**Verdict: No, but it changes the growth strategy.**

You made the right call excluding WhatsApp (ADR-001 is sound). But WhatsApp is the dominant messaging platform globally, especially in Brazil (your cultural origin for gude/bilhar) and the APAC region. Losing it means:

- No viral sharing via the world's largest messaging platform
- No "forward this to your bot" workflow from WhatsApp groups
- Brazil, India, and Southeast Asia (massive mobile-first markets) become harder to crack

**However:** Your app doesn't need WhatsApp for virality. The TikTok angle in your docs is actually your best growth vector. A screen recording of someone flicking colorful bubbles with satisfying pops is inherently shareable content. The *visual output* of the app is the viral mechanic, not messaging integration.

**What you should do:** Build a "share replay" feature that exports the last 10 seconds of flick interaction as a short video with your branding watermark. This is your viral loop — not messaging connectors.

---

## 3. THE 10-STAR PRODUCT

Let me walk up the star ladder for Gummy Bots:

**1-star (current):** A demo app with fake tasks, no real connectors, local-only.

**3-star (functional MVP):** Connect to real Gmail and Calendar. Tasks appear as real gummies. Flick sends a real email reply. Works on your phone.

**5-star (good product):** Bot learns your communication style. Drafted replies sound like you. Flick is the only step between "email received" and "email replied." Calendar conflicts auto-resolve. Streak system keeps you coming back daily.

**7-star (great product):** The bot anticipates tasks before you see them. "You usually reply to your boss within 2 hours — here's a gummy." The physics engine personalizes to your flick style. The bot personality evolves based on your behavior (aggressive flicker gets a competitive bot, careful previewer gets a thoughtful bot). ASMR pop sounds are tuned to your preferences.

**10-star (insanely great, absurd but directionally correct):**

> You wake up. Your phone shows a single screen: your bot, surrounded by 3 gummies. One blue ("Mom texted, wants to know about Sunday dinner — I've drafted 'Yes! I'll bring dessert'"), one green ("Your dentist moved your appointment to Thursday 3pm — I've already confirmed"), one orange ("That article about Rust you saved last week — here's the 3-sentence summary").
>
> You flick. Flick. Flick. Three satisfying pops. 15 seconds. Your inbox is at zero, your calendar is clean, and your reading list is processed.
>
> You haven't opened Gmail in 6 months. You haven't opened Google Calendar in 3 months. You don't remember your dentist's phone number. Your bot handles all of it. The only thing you do is flick.
>
> Your bot has evolved into a crystal dragon (you unlocked the legendary skin at level 50). It knows your communication patterns so well that your colleagues can't tell whether you or the bot wrote the reply. Your daily average is 47 flicks in 4 minutes — a personal record. Your streak is at 180 days.
>
> At work, your team uses Gummy Bots for delegation. Your manager flicks a "code review" gummy at you — it lands in your orbit. You long-press to preview the PR diff, flick to approve, and the bot posts the review on GitHub. The whole team's bots orbit on a shared screen in the office.

The 10-star version is **a replacement for email/calendar apps entirely**, not a layer on top of them. The flick becomes the universal "approve" gesture across all digital communication.

**The directional insight:** Your app shouldn't be another app people add to their routine. It should be the app that *replaces* their routine. Every flick should delete the need to open another app.

---

## 4. IMPLEMENTATION ALTERNATIVES

### Alternative A: "Polished Demo" (Ship in 1 week)

**What:** Take the current mobile app, hard-code 20 realistic mock tasks across all categories, polish the physics/haptics/audio loop to perfection, record a 30-second TikTok/Twitter video.

**Skip:** Real connectors, real LLM execution, web app, server deployment.

**Why:** Validate demand before building supply. If the video gets 100K views and 10K app installs from a "join waitlist" CTA, you know the interaction model resonates. If it gets 500 views, you've saved months of engineering.

**Effort:** 1 week (5 days)
- Day 1-2: Kill the web app. Polish mobile physics (tighten spring constants, add screen shake on combo).
- Day 3: Add 20 realistic mock tasks with timer-based appearance. Add "share replay" video export.
- Day 4: Record TikTok content. Multiple angles, slow-mo flicks, ASMR audio.
- Day 5: Ship to TestFlight. Set up waitlist landing page. Post video.

**Risk:** Low. You're only spending 1 week.
**Upside:** If it works, you have a waitlist and market validation. If it doesn't, you've learned the interaction model doesn't convert to installs and can pivot.

### Alternative B: "Real Gmail Bot" (Ship in 4 weeks)

**What:** Focus entirely on the Gmail connector. One connector, done perfectly. User connects Gmail via OAuth2. Real emails appear as gummies. Flicking triggers Bedrock to draft and send a real reply.

**Skip:** Calendar, Slack, News, Team Mode, web app, bot skins, achievements.

**Why:** Email is the highest-value, highest-frequency use case. If users will trust your bot to reply to their email, they'll trust it for everything else. Email is also the hardest problem (prompt injection risk, tone matching, context understanding). Nail this one and the rest are downhill.

**Effort:** 4 weeks
- Week 1: Gmail OAuth2 connector (read-only). Real emails → real gummies.
- Week 2: Bedrock execution agent — draft and send replies. Long-press preview before flick.
- Week 3: Prompt injection defense. Input sanitization pipeline. Output validation. Sandboxed OAuth scopes (compose-only, no delete).
- Week 4: Deploy Go server to Fly.io. Beta test with 10 users.

**Risk:** Medium. OAuth2 + Gmail API is well-documented but fiddly. Prompt injection defense requires serious security engineering.
**Upside:** A working "flick to reply to email" demo is a fundable product. This is what you show investors.

### Alternative C: "Desktop Agent with Flick UI" (Ship in 3 weeks)

**What:** Pivot from mobile to desktop. Build a macOS/Windows menubar app where gummies appear as a floating overlay. The bot monitors your notifications (email, Slack, calendar) and surfaces them as flickable bubbles on your desktop.

**Skip:** Mobile entirely. Go all-in on Electron/Tauri desktop app.

**Why:** Desktop is where knowledge workers actually live. Mobile productivity is a lie — nobody manages their inbox on their phone. Desktop also solves the local-first distribution problem: users already have a computer, you don't need them to run a separate server.

**Effort:** 3 weeks
- Week 1: Tauri app shell with canvas-based gummy rendering. Notification listener for macOS/Windows.
- Week 2: Bedrock integration. Gummies from notifications. Flick to execute.
- Week 3: Polish, tray icon, auto-start on login. Beta distribution.

**Risk:** High. You're throwing away your mobile codebase (14 sprints of work). Tauri is a different ecosystem.
**Upside:** If it works, you're building a "Raycast for AI agents" — a desktop command surface that replaces clicking through apps. That's a VC-fundable category.

---

## 5. RECOMMENDATION: What to Ship THIS WEEK

**Ship Alternative A. The polished demo with a TikTok video.**

Here's why, in order:

1. **You have no market validation.** Zero users have tried this. Zero ADHD users have given feedback. Zero emails have been sent via flick. Everything is a hypothesis. The fastest way to validate is a video that goes viral or doesn't.

2. **Your codebase is spread too thin.** You're maintaining 3 platforms with no tests. Adding real connectors now means adding complexity to an already fragile system. Polish what you have before expanding.

3. **The flick is either magic or it isn't.** No amount of backend engineering will save the product if the flick doesn't feel satisfying in a 10-second video. Test the core interaction first.

4. **You're a solo dev in Perth.** You can't outbuild Google/Microsoft on features. You can outbuild them on *feel*. The polished demo plays to your strength (the sprint harness, the physics iteration) and avoids your weakness (infrastructure, scale, compliance).

**Concrete actions for this week:**

| Day | Action |
|-----|--------|
| Mon | Delete the web/ directory from the product roadmap. It's a distraction. |
| Tue | Add 20 hardcoded realistic tasks with timed appearance. Polish pop sounds. |
| Wed | Add "share replay" — export last 10s as MP4 with watermark. |
| Thu | Record 5 TikTok-style videos. Different angles, slow-mo, ASMR mic. |
| Fri | Ship to TestFlight. Post videos. Set up waitlist at gummybots.app. |

**After this week, if the video resonates (>10K views, >500 waitlist signups):**
- Move to Alternative B (real Gmail connector, 4-week sprint)
- Start talking to investors with the viral video + waitlist numbers

**If the video doesn't resonate (<1K views, <50 signups):**
- The flick mechanic isn't compelling enough on its own
- Pivot to Alternative C (desktop agent) or reconsider the interaction model entirely

---

## Final Thought

Valter, you've built something genuinely novel. The flick-as-consent-primitive is a real insight that the AI industry hasn't figured out yet. But you're in love with the technology (the physics engine, the Go server, the dual-agent architecture) when you should be in love with the *problem* (people don't trust AI agents).

Ship the video. See if anyone cares. Then build the thing they care about.

---

*Office hours conducted 2026-03-27. Next check-in: after TikTok video launch.*

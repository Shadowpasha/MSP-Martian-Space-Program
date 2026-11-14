# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary:** kids aged 7–12 (the NASA Space Apps 2026 "Junior Astronaut Mission Trainer" target), playing in a browser, often for the first time, with no account or download.
- **Secondary:** older siblings, parents and classrooms. The game is built for 7–12 but deep enough that older players stay engaged.
- **Evaluators:** NASA Space Apps judges, who need to see the trade-off mechanic and the NASA data sources quickly.

## Product Purpose

MSP (Mars Station Program) lets players run a crewed station in Jezero Crater, Mars, and complete missions before a deadline. Every choice costs something: oxygen, power, food/water, materials or crew morale. Players should leave understanding a real constraint of deep-space survival, not just having played a game. Success = a young player can explain why a choice (e.g. batteries vs solar panels in a dust storm) mattered.

## Positioning

Inspired by *60 Seconds!*, but the pressure is a **mission deadline**, not pure survival. Every mission copies a job a real NASA mission or instrument has done (MOXIE, InSight, Ingenuity, Curiosity RAD, Perseverance sample depot, Veggie…), and the game shows the real fact and its source. Real NASA data, not invented numbers, grounds the mechanics.

## Operating Context

- **Game loop:** Main Menu → Mission Selection (3 random missions) → Cargo Prep (grid inventory packing) → Mission Phase (10-sol action blocks, random events, crew Q&A) → Upgrade (tech points) → repeat.
- **Time unit:** sols (Mars days). Movement in MP. Actions in AP (10 per 10-sol block).
- **Built by a hackathon team, one screen per developer**, merged later. Shared contract and visual system must keep screens consistent.
- **Mission data:** design in `docs/MISSIONS.md`; code in `src/data/missions.ts` (Tharsis survey) and `src/data/nasaMissions.ts` (Ice Hunter, Shadow Ice, Breathe Easy, Space Garden, Radiation Detective). Six playable missions, paged three at a time in the mission picker.
- **Flow:** `src/systems/flight.ts`: Menu → Mission Selection (briefing popup) → Cargo Preparation (`src/ui/cargoPacker.ts`) → Launch Summary (`src/ui/launchSummary.ts`) → survival run.

## Capabilities and Constraints

- **Stack:** Estella engine (TypeScript ECS, UI drawn by the engine), web export, 1280×720 design resolution. Chosen by the team; `DESIGN.md` §9.5's React/Three.js notes are superseded for implementation.
- **Resources:** O₂, PWR, RES (materials for building/repair), Food/Water, and crew spirit.
- **Must stay browser-playable**, with no account or download required (low barrier for judging and students).
- **Data attribution:** any NASA fact or dataset shown must cite its source in-game. Static curated data must not be presented as live.
- **Open decisions:**
  - LLM use (crew Q&A and LLM-resolved action plans from the team sketch) is **undecided**. Scripted multiple-choice Q&A is the working fallback.
  - The label for crew spirit (**Morals vs Morale**) is **undecided**. Keep one constant; don't rename per screen.
  - Whether the Captain (Keller) is the player or an assignable crew member is **undecided**.

## Brand Commitments

- **Name:** **MSP: Mars Station Program**.
- **Visual authority:** `DESIGN.md` (MSP-ART-001) and the three mockups in `docs/design/` (`mockup_main_menu.jpeg`, `mockup_crew.jpeg`, `mockup_upgrade.jpeg`). Use original assets only; reference games are direction, not sources. The flight screens use `src/ui/flightUi.ts` (palette matches the DESIGN.md tokens); the survival run still uses `src/ui/theme.ts`.
- **Crew archetypes:** Rourke (Engineer), Mira (Medic), Hale (Mechanic), Keller (Captain), Ishida (Scientist), Vance (Comms).

## Evidence on Hand

- NASA facts with verified sources for each mission, in `docs/MISSIONS.md` (MOXIE 122 g O₂; InSight 1,319 marsquakes; Ingenuity 72 flights; RAD 0.67 mSv/day; Three Forks depot; Veggie lettuce 2015; Opportunity 2018 dust storm).
- Challenge-recommended datasets: DONKI (space weather), OSDR/RadLab, Mars Trek, NASA Open APIs. None are integrated yet; don't claim live data.
- No testimonials, playtest results or user research exist. Don't fabricate them.

## Product Principles

1. **No free choice.** Every option costs a resource; there is never a safe pick with no cost.
2. **Real before invented.** Ground numbers and events in NASA data, and always show the source.
3. **Readable for a 7-year-old, deep enough for a 12-year-old and up.** Plain language, explain terms (sol, radiation dose) in context.
4. **Failure teaches, it doesn't punish.** Random missions and events encourage retrying with a new strategy.
5. **Few systems at once.** Keep the resources the player watches at any moment to a manageable few.

## Accessibility & Inclusion

- Young readers: short sentences, plain words, critical text readable at 1280×720.
- Never rely on color alone for warnings or effects; use icons and text too (also in `DESIGN.md` §3.2, §10).
- Keyboard path through every screen; click targets ≥ 40×40 px.

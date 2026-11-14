# Merge notes: main + MSP_Mokhtar + NASA missions

> **History.** This document describes the original Sol survival loop, which has since been retired: every
> mission now runs as an expedition (see `src/data/expeditions.ts` and the README).

This branch is **`main` → merge `MSP_Mokhtar` → fixes on top**. Mokhtar's launch flow is the game;
the commits on top add to it.

## The merge

One conflict, `src/main.ts`: Mokhtar replaced `gameUiSystem` with `flightSystem` (his flow mounts the
survival run itself); `main` had added `prepSystem` for the standalone Mission Prep scene. Resolved to
`flightSystem` only (the standalone scene was removed afterwards; its features now live in his flow).

## What is added on top of Mokhtar's flow

| Area | Files | What |
|---|---|---|
| Missions | `src/data/nasaMissions.ts`, `src/data/missions.ts` | Five NASA-based missions after the Tharsis survey (Ice Hunter, Shadow Ice on the Moon, Breathe Easy, Space Garden, Radiation Detective), each with its required cargo and a briefing. |
| Mission picker | `src/ui/flightScreens.ts` | Page arrows (3 cards per page); a briefing popup (what you do, the real NASA mission, fact + source, why it matters). |
| Cargo Preparation | `src/ui/cargoPacker.ts` (replaces `showCargo` in the flow) | Same items, stock and launch rules; tabbed inventory; drag and drop or click-then-cell; held items centre on the pointer and stay inside the bay; click a packed item to take it out; R / right-click rotate; Esc puts back; red preview with words; food/water/O₂ meters. |
| Launch Summary | `src/ui/launchSummary.ts` | New page after cargo: mission, four crew with perks, packed cargo, supply days, Back / Launch. |
| Survival loop | `gameContract.ts`, `solEngine.ts`, `geminiPlanner.ts` | `GOAL_FLAGS` adds `oxygen_produced`, `crop_harvested`, `radiation_measured`; the planner accepts them and uses the mission's own prep-sensor label. |
| Flow | `src/systems/flight.ts` | `review` page; the page gets input before the Escape-to-leave check so Esc can put back a held item. |
| Art | `assets/textures/outpost/`, `assets/textures/missions/`, `scripts/art/` | 45 code-drawn outpost assets (HUD, cargo, station, badges, banners, event cards, Moon backdrop) and the lunar map for Shadow Ice. Existing art was not replaced. |
| Docs | `DESIGN.md`, `PRODUCT.md`, `docs/design/`, `docs/MISSIONS.md`, `docs/CONTRACT-PROPOSAL.md` | Art direction, product record, mockups, mission plan, what is still open. |

## Tests changed in Mokhtar's files

- `tests/playtest.test.ts`, "mission offers expose one contract…": now expects six playable missions with briefings (it used to expect one).
- `tests/playtest.test.ts`, new test: plays every NASA mission in the survival loop until its goal completes.

## Checks

```
node scripts/verify.mjs   # typecheck + all tests
```

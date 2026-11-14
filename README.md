# Mars Outpost: Sol Survival (NASA Space Apps 2026)

Main Survival Loop built in **Estella Engine** (`1280x720`), implementing the 1-Sol Martian outpost loop with clickable crew perks, Gemini AI action-plan cost estimation, 60-Seconds-style daily events, and external Skill Tree modifier hooks.

## Opening and Playing in Estella Editor

1. Open **Estella Editor** and select **Open Project** -> `d:\Programming_Projects\Nasa_Space_Apps_2026`.
2. Open `assets/scenes/main.esscene` and press **Play**.
3. If you want live Gemini task estimation, paste your Gemini API key directly into `GEMINI_API_KEY` inside `src/services/geminiPlanner.ts` (`gemini-2.5-flash`). Without a key, **Issue Tasks** automatically uses the built-in offline cost estimator.

## Verification

Run the TypeScript check (against Estella's `sdk-types`) and simulation unit tests:

```powershell
node scripts/verify.mjs
```

## Team Integration Contracts (`src/contracts/gameContract.ts`)

Teammates building **Pick Mission & Crew**, **Pack the Rocket**, and the **Outer Skill Tree Menu** connect to the main loop via `MissionSetupInput`, `SkillTreeModifiers`, and `MainLoopResult` (either via TypeScript import or `esengine` `Storage` keys):

- `mars-outpost:pending-setup` (`MissionSetupInput`): planet (`mars` / `moon`), `targetSol`, `missionGoal`, starting `resources`, `conditions`, packed `cargo` counts, `crew` roster, and `skillModifiers`.
- `mars-outpost:skill-upgrades` (`string[]`): unlocked Skill Tree upgrade IDs supplied from the outer menu (`SkillTreeModifiers` still scales food/O2/energy/radiation inside the simulation, with no Skill Tree UI rendered in the main loop).
- `mars-outpost:last-result` (`MainLoopResult`): saved automatically when a run finishes with outcome, score, `researchPointsEarned`, and tactical lessons for the next run.

## Placeholder Art (`assets/textures/`)

All placeholder textures have stable `.png.meta` UUIDs. Your art team can overwrite these filenames directly without editing scenes or code:

- `assets/textures/outpost_bg.png` (`1280x720`)
- `assets/textures/crew_engineer.png` (`256x256`)
- `assets/textures/crew_botanist.png` (`256x256`)
- `assets/textures/crew_pilot.png` (`256x256`)
- `assets/textures/crew_medic.png` (`256x256`)
- `assets/textures/ai_robot.png` (`256x256`)

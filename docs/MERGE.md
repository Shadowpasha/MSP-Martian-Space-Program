# Mission Prep: Pick Mission & Crew + Pack the Rocket

Branch: `feature/mission-crew-cargo`. Three screens that run **before** the main survival loop and
hand it a `MissionSetupInput` through the existing contract.

```
Mission Select  →  Crew Pick  →  Pack the Rocket  →  Launch
(crater map)       (2 to 4)      (7×4 cargo grid)    writes Storage 'mars-outpost:pending-setup'
                                                     then switches to assets/scenes/main.esscene
```

## What changed in files you own

Only `src/main.ts` changed (+3 lines): it registers `prepSystem`. The system only runs in a scene that
has an entity named `PrepRoot`, so `main.esscene` behaves exactly as before.

Nothing else in `src/contracts`, `src/simulation`, `src/systems`, `src/ui`, `src/data` or
`src/services` was touched.

## New files

| Path | What |
|---|---|
| `assets/scenes/mission-prep.esscene` | Camera + Canvas + `PrepRoot`. Open it and press Play. |
| `src/prep/data/` | Missions (real NASA facts + sources), items, sites. Pure TS. |
| `src/prep/logic/` | Mission roll, rocket grid, checklist, `buildSetup()` → `MissionSetupInput`, flow state. Pure TS. |
| `src/prep/ui/` | design.md tokens (`tokens.ts`), asset loader, UI kit. |
| `src/prep/screens/` | `missionSelect.ts`, `crewPick.ts`, `packRocket.ts`, `shell.ts` (sidebar/header). |
| `src/prep/prepSystem.ts` | Input, drag and drop, screen rebuilds, Launch. |
| `assets/textures/prep/` | Pixel sprites, icons and two crater maps (nearest filtering). |
| `assets/fonts/` | Pixelify Sans + IBM Plex Mono, OFL licences included. |
| `scripts/art/prep_sprites.py` | Draws every sprite and map in code. Re-run to regenerate. |
| `scripts/verify-prep.mjs`, `tests/prep.test.ts` | Mission Prep tests. |
| `docs/MISSIONS.md`, `docs/CONTRACT-PROPOSAL.md` | Mission design and the proposal to unlock the rest. |
| `DESIGN.md`, `docs/design/mockup_*.jpeg` | Mokhtar's art direction (MSP-ART-001) and the three approved mockups. |
| `PRODUCT.md` | Product record: audience, purpose, principles, open decisions. |

## How it fits the contract

- `planet`, `targetSol`, `missionGoal` (with `requiredFlag`, coords, deadline, the four standard requirements at `current: 0`) come from the chosen mission and site.
- `crew` is the 2 to 4 people picked from `DEFAULT_CREW`.
- `startingResources` = outpost base reserves + packed crates (oxygen capped at 100).
- `cargo` = packed counts of repair kits, medkits, battery packs, seed pods, rations, and the mission hardware (`windSampler`).
- `skillModifiers` = `computeSkillModifiers(Storage 'mars-outpost:skill-upgrades')`.

Supply numbers mirror `advanceSol()`: food 1.0 × crew, water 0.9 × crew, O₂ 4.2 % per sol.
They live in `src/prep/logic/balance.ts`; if the loop's numbers change, change them there.
A test feeds the generated setup into `createInitialGameState` + `advanceSol` with 2, 3 and 4 crew.

## Checks

```
node scripts/verify.mjs        # your typecheck now covers src/prep too, plus your 7 tests
node scripts/verify-prep.mjs   # 9 Mission Prep tests
```

## Decisions left to the team

- **Start scene:** `project.esproject` still starts `main.esscene`. Point `defaultScene` at
  `assets/scenes/mission-prep.esscene` when the flow should start with Mission Prep (or a main menu that leads there).
- **Main menu, Crew roster, Upgrade, Settings:** the sidebar buttons open wireframe placeholders (`buildStub` in `src/prep/screens/shell.ts`). Swap in the real screens when they exist.
- **Visual style:** Mission Prep follows `design.md` tokens (`src/prep/ui/tokens.ts`); the main loop uses `src/ui/theme.ts`. Worth unifying.
- **Morals vs Morale**, and whether packing should pre-fill `requirements` (see the proposal).

# Contract proposal: unlock the other missions

**For:** the main-loop owner (`src/contracts/gameContract.ts`, `src/simulation/solEngine.ts`, `src/data/events.ts`, `src/ui/modals.ts`).
**Status:** part 1 is DONE on this branch (goal flags `oxygen_produced`, `crop_harvested`, `radiation_measured` in `GOAL_FLAGS`; Breathe Easy, Space Garden and Radiation Detective are playable). Parts 2–3 are still open.

## The problem

The mission plan has more NASA-based missions designed (see [MISSIONS.md](MISSIONS.md)), but the
main loop only understands two goals and one piece of mission hardware:

- `MissionGoal.requiredFlag` is `'wind_sample_collected' | 'ice_core_collected'`
- `CargoInventory.windSampler` is the only "goal hardware" slot (the ice-core goal reuses it too)

So today only **Storm Watch**, **Ice Hunter** (Mars) and **Shadow Ice** (Moon) are playable.

## The change (additive, nothing existing changes)

### 1. More goal flags

```ts
export type GoalFlag =
    | 'wind_sample_collected'
    | 'ice_core_collected'
    // new
    | 'oxygen_produced'       // Breathe Easy (MOXIE)
    | 'quakes_recorded'       // Quake Listener (InSight SEIS)
    | 'route_scouted'         // Sky Scout (Ingenuity)
    | 'radiation_measured'    // Radiation Detective (Curiosity RAD)
    | 'crop_harvested'        // Space Garden (Veggie)
    | 'samples_cached';       // Rock Collector (Perseverance depot)

// MissionGoal.requiredFlag: GoalFlag
// ActiveTask.rewardOnComplete.goalFlag?: GoalFlag
```

The offline planner (`evaluatePlanOffline`) and the Gemini prompt already pass `goal.requiredFlag`
through as a string, so they need the type widened plus one goal task template per flag.

### 2. Name the mission hardware instead of always calling it a wind sampler

Option A (smallest): keep `windSampler` as the slot, add a display name to the goal.

```ts
interface MissionGoal {
    // ...existing fields
    hardwareName?: string; // "Weather Sensor", "Ice Core Drill", "Oxygen Maker"...
}
```

`modals.ts` would show `goal.hardwareName ?? 'Wind Sampler'` in the cargo list, and the
`prep_wind_sampler` event text would use it too.

Option B (cleaner, bigger): rename the slot to `missionHardware` with a migration that reads
`windSampler` when present.

### 3. Optional: let packing pre-fill requirements

Cargo Preparation could set `requirements[prep_sensor].current = 1` when the hardware is packed and
`prep_supplies.current` from packed crates. Today it leaves every `current` at 0, so the main loop's
own prep tasks still run. Your call.

## Still open

- **Mission hardware naming (part 2).** The ice missions still require the "Wind Sampler" (its inventory text says "Required for the weather survey").
- **New cargo items.** Quake Listener (seismometer), Sky Scout (helicopter) and Rock Collector (drill) need new `CargoInventory` items, `CARGO_ITEMS` entries and icons; `flight_icons.png` is full (32/32).
- **Pre-filled requirements (part 3).** Packing does not fill `requirements[].current`; the survival loop's prep tasks still run.

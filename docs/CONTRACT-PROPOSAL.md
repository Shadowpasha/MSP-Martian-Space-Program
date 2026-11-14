# Contract proposal: unlock the other missions

**For:** the main-loop owner (`src/contracts/gameContract.ts`, `src/simulation/solEngine.ts`, `src/data/events.ts`, `src/ui/modals.ts`).
**Status:** proposal only. Mission Prep works today without it.

## The problem

Mission Prep has 9 more NASA-based missions designed (see [MISSIONS.md](MISSIONS.md)), but the
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
`windSampler` when present. Mission Prep can write either.

### 3. Optional: let packing pre-fill requirements

Mission Prep could set `requirements[prep_sensor].current = 1` when the hardware is packed and
`prep_supplies.current` from packed crates. Today it leaves every `current` at 0, so the main loop's
own prep tasks still run. Your call.

## What Mission Prep does once this lands

Flip the hidden missions in `src/prep/data/missions.ts` from `goalFlag: null` to their new flag, add
their hardware items in `src/prep/data/items.ts`, and they appear in the roll. No other change.

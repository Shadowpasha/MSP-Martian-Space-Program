# Mars Station Program

A pixel-art survival game built in Estella for NASA Space Apps. Prepare the station, ride out a regional storm, and bring the Site A field crew and their weather data home by the end of Sol 16.

## Windows playtest

1. Install [Estella Editor 0.104.1](https://github.com/esengine/estella/releases/tag/v0.104.1) and [Node.js 24 LTS with npm](https://nodejs.org/en/download).
2. Open PowerShell in the folder that contains `project.esproject`.

   ```powershell
   npm.cmd ci
   npm.cmd run verify
   ```

3. In Estella, use **Open Project** to select that folder, open `assets/scenes/main.esscene`, and press **F5**.
4. To play the Web export, choose **Build → Package Project → Web** and set the output directory to `dist/web`. After packaging, run `npm.cmd run playtest` and visit [the local game](http://127.0.0.1:4173/). Keep that address for a consistent browser save. The package dialog also has **Preview over HTTP**.

### Live Gemini playtest

Set `GEMINI_API_KEY` in an untracked `.env` beside `package.json`, or in the terminal environment. Run `npm.cmd run playtest` and open [the local game](http://127.0.0.1:4173/). The local Node server holds the key and makes the requests. Restart it after changing `.env`. Set `GEMINI_MODEL` to override the server’s default model. The website runs the same server; see [docs/DEPLOY.md](docs/DEPLOY.md) for its settings.

- Open **A.R.I.E.S.** from the station for an open discussion, or select **Discuss procedure** on a work order. Ask for options or describe a tradeoff. For example, ask what equipment can be sacrificed when Materials are low, then decide whether to give up some solar output or preserve it. Review any new or revised task beside the conversation and confirm it before assigning a lead in **Tasks**.
- **End Sol** starts the next briefing while the report is open. Leave the report open until the drafting indicator clears to receive it, or open the next briefing immediately. Editor Play and static previews use authored briefings. You can select procedures from the work-order screen when the terminal is unavailable.

## First mission

- Start in **Crew** to swap specialists. Remove one to free a seat, then add a replacement. Exactly four crew must launch.
- Open **Upgrade** to spend the three starting research points on a Tier 1 node. Completed missions award research based on their results.
- Choose **Play → Tharsis Ridge Weather Survey**. In cargo preparation, place the Wind Sampler and any supplies you want. Select an inventory item and then a cell to place it. Select an existing piece to rotate, move, or remove it. Use **Tab**, **arrows**, and **Enter** to navigate. **R**, **M**, and **Delete** are cargo shortcuts.
- Resolve the briefing and read the revealed outcome. The dispatch checklist links to each department’s work orders. Schedule work, then select a lead with the keyboard or drag a crew card onto the lead slot. Assign different crew to work in parallel.
- Hover or focus a resource to preview its Sols remaining. Open it for passive recovery, heating and filtration, and scheduled task costs and yields. Rotate crew through rest Sols to restore 12 Morale and reset their duty streak. Work pace drops below 60% Morale and drops again below 35%.
- Open **Conditions** to check solar generation, heating and filter draw, and the projected radiation dose. Dust reduces solar generation and cold costs Power at both locations. Shelter and shielding cut incoming radiation. Sustained exposure injures crew and can halt outside work and sampling.
- Select the two travelers in **Rover Checklist** before certifying their suits. At Tharsis, a Pilot makes a clean trip four Sols and a backup driver needs six. The checklist shows clear-weather and peak-storm supply costs. Harden the rover and pack the storm reserve for trips that overlap the storm.
- Once the checklist is complete, confirm a load within 20 slots and dispatch. Use **Station / Expedition** to manage both locations. Field events and upkeep use rover stock. You can order a rest Sol from **Expedition supplies**. It uses supplies, pauses travel, and resets a partial sample. Complete two consecutive survey Sols at Site A, then dock by the deadline with at least 10 Food, 10 Water, and 25% station O₂.

## Team integration

See [Gameplay rules and UML](docs/GAMEPLAY-UML.md) for mission states, Sol resolution, and the station and rover rules.

`MissionSetupInput` defines the mission, roster, starting conditions and packed quantities. Every mission runs as an expedition (`rules: 'tharsis-expedition'`); `expedition` picks its profile in `src/data/expeditions.ts`: `tharsis` (Easy), `radiation` (Medium, a solar storm) or `ice` (Hard, a long cold drive). A team-provided setup without a profile runs as the Tharsis survey. The other missions in the picker are marked *Coming soon*. The original Sol survival loop was retired. The optional goal fields `minimumReserves` and `requiredEquipment` gate completion. Older manifests can omit water-canister and oxygen-tank counts.

- `mars-outpost:pending-setup` accepts a team-provided `MissionSetupInput`. Play offers that mission and its prepared cargo and crew. The launch consumes the pending setup.
- `mars-outpost:skill-upgrades` retains the legacy unlocked-ID list. The current profile lives under `mars-outpost:profile-v1`.
- `mars-outpost:last-result` holds the latest `MainLoopResult`, including the expedition outcome and earned research.

See [the art sources](art/README.md) for the station, portraits, icons, and bundled font licenses.
See [CREDITS.md](CREDITS.md) for every asset, font, fact source and contributor.

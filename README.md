# Mars Station Program

A pixel-art survival game built in Estella for NASA Space Apps. Pick four crew, plan station upgrades, pack a cargo bay, and complete the Tharsis Ridge Weather Survey before Sol 16.

## Windows playtest

1. Install [Estella Editor 0.104.1](https://github.com/esengine/estella/releases/tag/v0.104.1) and [Node.js 24 LTS with npm](https://nodejs.org/en/download).
2. Open PowerShell in the folder that contains `project.esproject`.

   ```powershell
   npm.cmd ci
   npm.cmd run verify
   ```

3. In Estella, use **Open Project** to select that folder, open `assets/scenes/main.esscene`, and press **F5**.
4. To play the Web export, choose **Build → Package Project → Web** and set the output directory to `dist/web`. After packaging, run `npm.cmd run playtest` and visit [the local game](http://127.0.0.1:4173/). Keep that address for a consistent browser save. The package dialog also has **Preview over HTTP**.

The four mission quick actions use the built-in planner. The complete game runs offline without a Gemini key. The local preview serves the Web build directory.

## First mission

- Start in **Crew** to swap specialists. Remove one to free a seat, then add a replacement. Exactly four crew must launch.
- Open **Upgrade** to spend the three starting research points on a Tier 1 node. Completed missions award research based on their results.
- Choose **Play → Tharsis Ridge Weather Survey**. In cargo preparation, place the Wind Sampler and any supplies you want. Select an inventory item and then a cell to place it. Select an existing piece to rotate, move, or remove it. Use **Tab**, **arrows**, and **Enter** to navigate. **R**, **M**, and **Delete** are cargo shortcuts.
- Resolve the daily event, read the outcome, and continue to planning. Use **Issue Task** to open the quick actions. For a quick win, prepare the sensor, rover, and supplies on Sol 1. Two completed supply tasks or one supply task plus two consumed cargo supplies fill the four prep units. Run **Gather Data** with two living crew for two Sols, and keep 10 Food, 10 Water, and 25% O₂ after the final day's costs. Read the Sol report after each **End Sol**.

## Team integration

`MissionSetupInput` defines the mission, roster, starting conditions and packed quantities. The optional goal fields `minimumReserves` and `requiredEquipment` gate completion. Missing water-container and oxygen-tank counts in older manifests are treated as zero.

- `mars-outpost:pending-setup` accepts a team-provided `MissionSetupInput`. Play offers that mission and its prepared cargo and crew. The launch consumes the pending setup.
- `mars-outpost:skill-upgrades` retains the legacy unlocked-ID list. The current profile lives under `mars-outpost:profile-v1`.
- `mars-outpost:last-result` holds the latest `MainLoopResult`, including the expedition outcome and earned research.

See [the art sources](art/README.md) for the station, portraits, icons, and bundled font licenses.

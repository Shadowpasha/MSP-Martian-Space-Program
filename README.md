<p align="center"><img src="docs/itch/header-960x260.png" alt="Mars Station Program" width="960"></p>

<p align="center">
  <a href="https://msp.amerai.top/"><img alt="Play here" src="https://img.shields.io/badge/PLAY%20HERE-F5B84F?style=for-the-badge&labelColor=131422" height="48"></a>
  &nbsp;
  <a href="https://amer-adam.itch.io/mars-station-program"><img alt="Mars Station Program on itch.io" src="https://img.shields.io/badge/itch.io-FA5C5C?style=for-the-badge&logo=itchdotio&logoColor=white" height="48"></a>
</p>

<p align="center">
  <a href="https://github.com/Shadowpasha/MSP-Martian-Space-Program/releases/latest"><img alt="Latest release" src="https://img.shields.io/github/v/release/Shadowpasha/MSP-Martian-Space-Program?style=flat-square&color=4FC7F7&labelColor=1B1E32"></a>
  <img alt="NASA Space Apps" src="https://img.shields.io/badge/NASA-Space%20Apps-0B3D91?style=flat-square&labelColor=1B1E32">
  <img alt="Made with Estella" src="https://img.shields.io/badge/made%20with-Estella-F5B84F?style=flat-square&labelColor=1B1E32">
</p>

<p align="center">A pixel-art Mars survival game for NASA Space Apps. Pick a crew, pack the rover, survive the storms, and bring the science home before the deadline.</p>

<p align="center"><a href="https://msp.amerai.top/"><img alt="Main menu with the crew walking the station" src="docs/gifs/menu.gif"></a></p>

## Missions

<div align="center">
<table>
<tr><th>Mission</th><th>Difficulty</th><th>Goal</th></tr>
<tr><td><b>Tharsis Training Run</b></td><td>Tutorial</td><td>Learn the game with ARIES in 5 Sols</td></tr>
<tr><td><b>Tharsis Ridge Weather Survey</b></td><td>Easy</td><td>Record 48h of weather data</td></tr>
<tr><td><b>Radiation Detective</b></td><td>Medium</td><td>Record 72h of radiation during a solar storm</td></tr>
<tr><td><b>Ice Hunter</b></td><td>Hard</td><td>Drill ice cores at Jezero Crater in deep cold</td></tr>
</table>
</div>

<p align="center"><img src="docs/screenshots/mission-select.jpg" alt="Mission Selection" width="640"></p>

<p align="center"><img src="docs/gifs/launch.gif" alt="Launch, cruise and landing" width="640"></p>

## How It Plays

**1. Pick your crew.** Choose 4 of 6 real NASA astronauts, each with their own skill.

<p align="center"><img src="docs/screenshots/crew-select.jpg" alt="Crew Selection" width="640"></p>

<p align="center"><img src="docs/screenshots/launch-summary.jpg" alt="Launch Summary" width="640"></p>

**2. Pack the rover.** Fit the instrument, food, water and oxygen into a 6×4 cargo grid.

<p align="center"><img src="docs/gifs/cargo.gif" alt="Packing the cargo bay by hand" width="640"></p>

**3. Run the station.** Each Sol, handle the morning news, assign crew to jobs, and send two of them out in the rover.

<p align="center"><img src="docs/gifs/station.gif" alt="Station crew at work, then the airlock to the expedition site" width="640"></p>

<p align="center"><img src="docs/screenshots/morning-briefing.jpg" alt="Morning Briefing" width="640"></p>

<p align="center"><img src="docs/gifs/endsol.gif" alt="End of Sol crew report" width="640"></p>

**4. Upgrade.** Spend research points on power, survival, operations and crew upgrades.

<p align="center"><img src="docs/gifs/upgrade.gif" alt="Unlocking an upgrade" width="640"></p>

**ARIES**, the station robot, guides new players step by step and can give live advice through Gemini.

## Run It Locally


1. Install [Estella Editor 0.104.1](https://github.com/esengine/estella/releases/tag/v0.104.1) and [Node.js 24](https://nodejs.org/en/download).
2. In this folder, run `npm.cmd ci`.
3. Open the folder in Estella, open `assets/scenes/main.esscene`, and press **F5**.

Web build and live Gemini setup: [docs/DEPLOY.md](docs/DEPLOY.md). Game rules: [docs/GAMEPLAY-UML.md](docs/GAMEPLAY-UML.md). Credits: [CREDITS.md](CREDITS.md).

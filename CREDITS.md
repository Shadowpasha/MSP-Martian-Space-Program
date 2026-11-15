# Credits

MSP: Mars Station Program, made for the NASA Space Apps Challenge 2026
("Build a Junior Astronaut Mission Trainer").

## Team

- Mokhtar Ouardi ([@MokhtarOuardi](https://github.com/MokhtarOuardi)): launch flow, menus, Tharsis Ridge expedition, A.R.I.E.S. terminal and work console
- Anas Aburaya
- [@Shadowpasha](https://github.com/Shadowpasha): the original Sol survival loop (since retired), Gemini planner and events, music and sound system
- Adam ([@amer-adam](https://github.com/amer-adam)): missions, Mission Selection, Cargo Preparation, Launch Summary,
  Crew and Upgrade redo, launch intro, animations, UI sound effects, and the Radiation and Ice expeditions

## AI assistance

Parts of the code, the generated UI sound effects and the generated pixel sprites listed below were written
with **Claude** (Anthropic's AI assistant) in Claude Code, working with Adam. Every fact shown in the game was
checked against the sources listed under *Facts and sources*.

A.R.I.E.S. (the expedition briefings and work-order assistant) can use **Google Gemini** at runtime through the local playtest server (`scripts/playtest.mjs`, `src/services/geminiPlanner.ts`).

## Audio

| Files | Source | Licence |
|---|---|---|
| `assets/audio/bgm_menu.ogg` | "Another Space Background Track (Observing The Star)", OpenGameArt.org | CC0 1.0 |
| `assets/audio/bgm_game.ogg` | "Crimson Space Station Background Ambient Music 1", OpenGameArt.org | CC0 1.0 |
| `assets/audio/mission/*.ogg` | [8-bit Space Music](https://kyrasvoice.itch.io/8-bit-space-music) © 2024 Kyra van Meijl. Eight tracks converted to Ogg Vorbis. | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) |
| `assets/audio/sfx_*.ogg` | Kenney, "Interface Sounds" pack (kenney.nl / OpenGameArt.org) | CC0 1.0 |
| `assets/audio/ui/*.wav` | Original. Generated in code by `scripts/art/sfx.py` (no samples or third-party files) | Made for this project |

See also `assets/audio/CREDITS.txt`.

## Art

| Files | Source |
|---|---|
| `assets/textures/launch/*` (rocket, flames, Earth, Mars, Moon) | Original pixel art, drawn in code by `scripts/art/launch_sprites.py` |
| `assets/textures/outpost/*` (HUD, cargo, station, badges, banners, event cards, Moon backdrop) | Original pixel art, drawn in code by `scripts/art/outpost_sprites.py` |
| `assets/textures/missions/map_lunar_south_pole_320x180.png` | Original pixel art, drawn in code by `scripts/art/prep_sprites.py` |
| `menu_station.png`, `menu_landscape.png`, `mission_1..3.png`, crew portraits (`crew_*.png`), Tharsis backgrounds (`tharsis_station.png`, `tharsis_site.png`) | AI image generation (ImageGen), exported as pixel art. Sources and prompts: [`art/README.md`](art/README.md), [`art/image-prompts.md`](art/image-prompts.md) |
| `flight_icons.png` | Supplied MSP icons plus glyphs made for this build. See [`art/README.md`](art/README.md) |
| `outpost_bg.png` (pixel-art Mars station interior), `ai_robot.png` | Added by the team. **TODO: record the source and licence here.** |

## Fonts

| File | Font | Licence |
|---|---|---|
| `assets/fonts/pixelify_sans.ttf` | Pixelify Sans by Stefie Justprince (Google Fonts) | SIL Open Font License 1.1 |
| `assets/fonts/ibm_plex_mono.ttf` | IBM Plex Mono by IBM (Google Fonts) | SIL Open Font License 1.1 |

The full licence texts ship next to the fonts: `assets/fonts/*_OFL.txt`.

## Facts and sources

**Crew.** The six crew members are real astronauts. Every fact in their bios is listed with its source in
[`docs/CREW.md`](docs/CREW.md):

- **Neil Armstrong:** [NASA: Neil A. Armstrong](https://www.nasa.gov/people/neil-a-armstrong/)
- **Eileen Collins:** [NASA: Former Astronaut Eileen Collins](https://www.nasa.gov/former-astronaut-eileen-collins)
- **Kalpana Chawla:** [NASA biography (PDF)](https://www.nasa.gov/wp-content/uploads/2020/09/chawla_kalpana.pdf)
- **Bernard A. Harris Jr.:** [NASA biography (PDF)](https://www.nasa.gov/wp-content/uploads/2016/01/harris_bernard.pdf)
- **Chiaki Mukai:** [JAXA: Chiaki Mukai](https://humans-in-space.jaxa.jp/en/astronaut/mukai-chiaki/)
- **Scott Kelly:** two NASA sources:
  - [NASA: 340-day mission](https://www.nasa.gov/?p=52161)
  - [NASA: First flower grown in Veggie](https://www.nasa.gov/image-article/first-flower-grown-space-stations-veggie-facility/)

**Missions.** Each mission's briefing shows a real NASA mission and its source (`src/data/nasaMissions.ts`,
[`docs/MISSIONS.md`](docs/MISSIONS.md)):

- [NASA Science: Perseverance instruments](https://science.nasa.gov/mission/mars-2020-perseverance/science-instruments/)
- [NASA Astrobiology: Phoenix lander found ice (2008)](https://astrobiology.nasa.gov/news/bright-chunks-at-phoenix-landers-mars-site-must-have-been-ice/)
- [NASA Science: LCROSS mission](https://science.nasa.gov/mission/lcross/)
- [NASA JPL: MOXIE completes Mars mission (2023)](https://www.jpl.nasa.gov/news/nasas-oxygen-generating-experiment-moxie-completes-mars-mission/)
- [SwRI: First radiation measurements from the surface of Mars](https://www.swri.org/press-release/swri-scientists-publish-first-radiation-measurements-surface-mars)
- [NASA DONKI space weather database](https://kauai.ccmc.gsfc.nasa.gov/DONKI/)
- [Phys.org: First bite of space-grown lettuce (NASA Veggie, 2015)](https://phys.org/news/2015-08-space-grown-lettuce-awesome.html)
- NASA: Opportunity rover mission comes to end (2019), for the Tharsis weather survey

NASA and JAXA names and mission names are used for education only. This project is not endorsed by NASA or JAXA.

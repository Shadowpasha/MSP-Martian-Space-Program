# Mission Plan: Junior Astronaut Mission Trainer

> **How this maps to the code:** this is the original design for the full mission pool.
> What is playable today lives in `src/data/nasaMissions.ts`: **Ice Hunter**, **Shadow Ice** (Moon),
> **Breathe Easy**, **Space Garden** and **Radiation Detective**, next to the Tharsis survey in
> `src/data/missions.ts`. Storm Watch is left out (same goal as Tharsis). Quake Listener, Sky Scout
> and Rock Collector would need new cargo items; see [CONTRACT-PROPOSAL.md](CONTRACT-PROPOSAL.md).
> Crew names, resources and cargo in the code follow `src/contracts/gameContract.ts`, not
> the placeholder roster in this document.

7 missions for the base in **Jezero Crater, Mars**. Each one copies a job a real NASA mission did, so every mission can show a true fact and a source to the player. This covers the challenge's request to use real NASA data and to give every choice a trade-off.

---

## How a mission works (as agreed in the chat)

`Play → Mission Selection (3 random missions) → Cargo Prep (pack the rover) → Mission Phase → back to base`

| Term | Meaning |
|---|---|
| **Sol** | One Mars day (24 h 39 min). |
| **MP** | Movement points. The rover drives **5 MP per sol**. |
| **Deadline** | The sol by which the task at the site must be **finished**. Counted from the day you leave the base. |
| **Resources** | **O2**, **PwR** (power), **Food/Water**, **RES** (materials for building and repairs), **Morale**. |

### Resource rules (the same for every mission)

- **Default daily use:** each crew member uses **1 O2 and 1 Food/Water per sol**. With 4 people at the base that's −4 food/sol and −4 O2/sol, matching Mokhtar's example.
- **Driving:** the rover uses **1 PwR per sol** it drives.
- **Task cost:** each mission has an extra cost per sol while the crew works at the site. It **stacks on top of** the default use.
- **Supplies to pack = crew × total sols (O2 and food) + driving power + task cost.** The numbers in each checklist below come from this formula.
- 1 O2 unit ≈ what one astronaut breathes in one sol. NASA plans for about 0.84 kg of oxygen per person per day.

### Each mission has

1. **Goal + deadline + distance**
2. **Requirements checklist.** The player must meet all of it before **Launch** (`0/1 Prep Weather Sensor`, `0/2 Assign crew`, …).
3. **Resource cost** (default + task)
4. **Hazards.** The random events that can happen. One of them may appear in the **forecast**, so the player can prepare.
5. **Science Q&A event.** A crew member asks the captain (the player) a question. A right answer makes the event's cost smaller.
6. **Reward:** tech points, sometimes an unlock
7. **Real NASA fact + source:** shown to the player
8. **Trade-off:** what the mission teaches

---

## Overview

| # | Mission | Difficulty | Based on | Site | Distance | Deadline | Crew |
|---|---|---|---|---|---|---|---|
| 1 | Storm Watch | ★☆☆ | MEDA / REMS weather stations, Opportunity's dust storm | Belva Crater | 25 MP | 15 sols | 2 |
| 2 | Sky Scout | ★☆☆ | Ingenuity helicopter | Hawksbill Gap | 20 MP | 12 sols | 2 |
| 3 | Space Garden | ★☆☆ | NASA Veggie (ISS) | Octavia E. Butler Landing | 5 MP | 10 sols | 2 |
| 4 | Breathe Easy | ★★☆ | MOXIE oxygen maker | Three Forks | 15 MP | 12 sols | 2 |
| 5 | Rock Collector | ★★☆ | Perseverance sample depot | Three Forks | 15 MP | 11 sols | 2 |
| 6 | Quake Listener | ★★☆ | InSight seismometer | Séítah | 10 MP | 11 sols | 2 |
| 7 | Radiation Detective | ★★★ | Curiosity RAD + DONKI solar data | Belva Crater | 25 MP | 14 sols | 3 |

The sites are real places that Perseverance explored inside Jezero Crater. The distances in MP are game values, not real distances.

---

## 1. Storm Watch ★☆☆

**Goal:** Dust storm season is starting. Set up a weather station at **Belva Crater** and record weather data for **3 sols**, so the base gets better storm warnings.

- **Distance:** 25 MP → 5 sols each way
- **Deadline:** data finished by **sol 15** (5 driving + 3 working + 7 spare)
- **Trip length:** 13 sols (there and back)

**Requirements**
- [ ] 0/1 Weather Station
- [ ] 0/2 Batteries
- [ ] 0/1 Prep Rover
- [ ] 0/26 O2
- [ ] 0/26 Food/Water
- [ ] 0/13 PwR (10 driving + 3 working)
- [ ] 0/2 Assign crew (must include a **Scientist**)

**Resource cost:** default use + **1 PwR/sol** while recording

**Hazards:** Dust storm (forecastable), dusty solar panels

**Q&A event:** *"Captain, our solar power just dropped by half. What's happening?"*
- ✅ Dust in the air is blocking sunlight from the panels
- ❌ The cold weather froze the batteries
- ❌ The Sun is further away today

**Reward:** 3 tech points + unlocks **Weather Forecast** (see 10 sols ahead)

**Real NASA fact:** In 2018 a dust storm covered all of Mars. It blocked so much sunlight that the solar-powered **Opportunity** rover ran out of power and never woke up again. Perseverance carries a weather station called **MEDA**, and Curiosity has one called **REMS**.

**Trade-off:** Batteries take cargo space, but they keep your instruments working when dust blocks the Sun.

**Sources:** [NASA: Opportunity mission comes to end](https://www.nasa.gov/news-release/nasas-record-setting-opportunity-rover-mission-on-mars-comes-to-end/) · [NASA: Perseverance instruments](https://science.nasa.gov/mission/mars-2020-perseverance/science-instruments/)

---

## 2. Sky Scout ★☆☆

**Goal:** Fly a mini helicopter over **Hawksbill Gap** and take scouting flights for **2 sols** to find a safe path for future rovers.

- **Distance:** 20 MP → 4 sols each way
- **Deadline:** **sol 12**
- **Trip length:** 10 sols

**Requirements**
- [ ] 0/1 Mini Helicopter
- [ ] 0/1 Survey Camera
- [ ] 0/1 Battery
- [ ] 0/1 Prep Rover
- [ ] 0/20 O2
- [ ] 0/20 Food/Water
- [ ] 0/12 PwR (8 driving + 4 flying)
- [ ] 0/2 Assign crew (must include a **Pilot**)

**Resource cost:** default use + **2 PwR/sol** while flying

**Hazards:** Dust storm (no flying in a storm), equipment failure

**Q&A event:** *"Captain, why does our helicopter need such big blades that spin so fast?"*
- ✅ Mars air is very thin, about 1% as thick as Earth's, so the blades must push a lot of air to lift
- ❌ Mars gravity is stronger than Earth's
- ❌ To scare away dust devils

**Reward:** 3 tech points + unlocks **Rover Speed +1 MP/sol**

**Real NASA fact:** NASA planned 5 test flights for **Ingenuity**. It flew **72 times** over almost 3 years, until a damaged blade ended the mission in January 2024.

**Trade-off:** Scouting first costs power and time, but it keeps the rover from getting stuck or damaged.

**Source:** [NASA: Ingenuity's mission ends after three years](https://www.nasa.gov/news-release/after-three-years-on-mars-nasas-ingenuity-helicopter-mission-ends/)

---

## 3. Space Garden ★☆☆

**Goal:** Set up a test greenhouse at **Octavia E. Butler Landing** and look after the plants for **5 sols**.

- **Distance:** 5 MP → 1 sol each way
- **Deadline:** **sol 10**
- **Trip length:** 7 sols

**Requirements**
- [ ] 0/1 Greenhouse Kit
- [ ] 0/2 Batteries
- [ ] 0/1 Prep Rover
- [ ] 0/14 O2
- [ ] 0/14 Food/Water
- [ ] 0/12 PwR (2 driving + 10 for grow lights)
- [ ] 0/2 Assign crew (must include a **Scientist**)

**Resource cost:** default use + **2 PwR/sol** for the LED lights

**Hazards:** Cold snap (heaters need extra power), dust storm

**Q&A event:** *"Captain, besides light and water, what gas do the plants take from the air?"*
- ✅ Carbon dioxide, and they give back oxygen
- ❌ Oxygen
- ❌ Helium

**Reward:** 3 tech points + **10 Food/Water** + **10 Morale** + unlocks **Food Production** at the base

**Real NASA fact:** On August 10, 2015, astronauts on the International Space Station ate the first lettuce grown for eating in space. It grew for 33 days in NASA's **Veggie** system under LED lights.

**Trade-off:** Plants need light, and lights need power. Growing food costs electricity now, but means carrying less food later.

**Source:** [Phys.org: First bite of space-grown lettuce (NASA Veggie)](https://phys.org/news/2015-08-space-grown-lettuce-awesome.html)

---

## 4. Breathe Easy ★★☆

**Goal:** Mars air is mostly carbon dioxide. Test an oxygen maker at **Three Forks** for **4 sols**, so future crews can make oxygen instead of carrying it.

- **Distance:** 15 MP → 3 sols each way
- **Deadline:** **sol 12**
- **Trip length:** 10 sols

**Requirements**
- [ ] 0/1 Oxygen Maker
- [ ] 0/1 Solar Panel
- [ ] 0/1 Battery
- [ ] 0/1 Prep Rover
- [ ] 0/20 O2
- [ ] 0/20 Food/Water
- [ ] 0/14 PwR (6 driving + 8 for the oxygen maker)
- [ ] 0/2 Assign crew (must include an **Engineer**)

**Resource cost:** default use + **2 PwR/sol** while the maker runs

**Hazards:** Dusty solar panels, equipment failure

**Q&A event:** *"Captain, what is Mars air mostly made of?"*
- ✅ Carbon dioxide, about 95%
- ❌ Oxygen
- ❌ Nitrogen, like Earth's air

**Reward:** 4 tech points + **10 O2** + unlocks **O2 Production** at the base

**Real NASA fact:** **MOXIE**, on the Perseverance rover, made **122 grams** of oxygen on Mars. That's about what a small dog breathes in 10 hours. At its best it made 12 grams per hour, at 98% purity or better.

**Trade-off:** Making oxygen means packing fewer oxygen tanks, but the machine uses a lot of power. You trade electricity for air.

**Source:** [NASA JPL: MOXIE completes Mars mission](https://www.jpl.nasa.gov/news/nasas-oxygen-generating-experiment-moxie-completes-mars-mission/)

---

## 5. Rock Collector ★★☆

**Goal:** Drill rock cores at **Three Forks**, seal them in tubes, and leave them in a safe spot for a future pickup. **4 sols** of drilling.

- **Distance:** 15 MP → 3 sols each way
- **Deadline:** **sol 11**
- **Trip length:** 10 sols

**Requirements**
- [ ] 0/1 Core Drill
- [ ] 0/1 Sample Tube Case
- [ ] 0/2 Spare Parts (RES), because drill bits break
- [ ] 0/1 Prep Rover
- [ ] 0/20 O2
- [ ] 0/20 Food/Water
- [ ] 0/10 PwR (6 driving + 4 drilling)
- [ ] 0/2 Assign crew (must include a **Scientist**)

**Resource cost:** default use + **1 PwR/sol** while drilling

**Hazards:** Rough terrain (slows the rover), equipment failure (drill jams)

**Q&A event:** *"Captain, why do we seal every sample in a tube right after drilling?"*
- ✅ So nothing from outside gets in, and scientists can trust what they find
- ❌ So the rocks don't melt
- ❌ To make them lighter

**Reward:** 4 tech points + unlocks **Delayed Cargo** (an extra cargo drop that arrives after n sols)

**Real NASA fact:** In January 2023 **Perseverance** finished a sample depot at **Three Forks**. It laid out 10 tubes in a zigzag, each 5 to 15 meters from the next, so a future helicopter could pick them up one by one.

**Trade-off:** The drill is long and heavy. Room for science gear is room you can't use for supplies.

**Source:** [NASA Photojournal PIA25681: Three Forks sample depot](https://photojournal.jpl.nasa.gov/catalog/PIA25681)

---

## 6. Quake Listener ★★☆

**Goal:** Place a seismometer at **Séítah**, far from the noisy base, and listen for marsquakes for **5 sols**.

- **Distance:** 10 MP → 2 sols each way
- **Deadline:** **sol 11**
- **Trip length:** 9 sols

**Requirements**
- [ ] 0/1 Seismometer
- [ ] 0/1 Solar Panel
- [ ] 0/1 Dust Brush
- [ ] 0/1 Prep Rover
- [ ] 0/18 O2
- [ ] 0/18 Food/Water
- [ ] 0/9 PwR (4 driving + 5 listening)
- [ ] 0/2 Assign crew (must include an **Engineer**)

**Resource cost:** default use + **1 PwR/sol**. **Dust builds up:** the solar panel loses power every sol unless someone spends an action cleaning it.

**Hazards:** Dusty solar panels, cold snap (nights below −80 °C)

**Q&A event:** *"Captain, the seismometer felt a shake! What causes marsquakes?"*
- ✅ Rocks deep inside Mars cracking and shifting, and sometimes a meteorite hitting the ground
- ❌ The wind blowing on the seismometer
- ❌ The rover driving past

**Reward:** 4 tech points + **+50% battery capacity** (upgrade from the list)

**Real NASA fact:** NASA's **InSight** lander felt **1,319 marsquakes**, including at least one caused by a meteoroid impact. Its mission ended in December 2022 because dust slowly covered its solar panels until there wasn't enough power left.

**Trade-off:** Cleaning panels costs crew actions every few sols. If you skip it, the power drains away slowly.

**Source:** [NASA JPL: NASA retires InSight Mars lander](https://www.jpl.nasa.gov/news/nasa-retires-insight-mars-lander-mission-after-years-of-science)

---

## 7. Radiation Detective ★★★

**Goal:** Mars has no magnetic shield and very thin air, so radiation from space reaches the ground. Measure it at **Belva Crater** for **4 sols** and keep the crew safe while you do it.

- **Distance:** 25 MP → 5 sols each way
- **Deadline:** **sol 14** (very little spare time)
- **Trip length:** 14 sols

**Requirements**
- [ ] 0/1 Radiation Detector
- [ ] 0/1 Radiation Shelter (a big 2×2 item)
- [ ] 0/1 Medkit
- [ ] 0/1 Prep Rover
- [ ] 0/42 O2
- [ ] 0/42 Food/Water
- [ ] 0/14 PwR (10 driving + 4 measuring)
- [ ] 0/3 Assign crew (must include a **Scientist** and a **Medic**)

**Resource cost:** default use + **1 PwR/sol**. With 3 crew, food and O2 run out much faster than on the other missions.

**Hazards:** Solar storm (a burst of radiation from the Sun). Without the shelter, the crew loses health and Morale. **Idea:** roll this event from a real past solar event in NASA's DONKI database and tell the player the date it really happened.

**Q&A event:** *"Captain, why does Mars get more space radiation than Earth?"*
- ✅ Mars has no global magnetic field and its air is very thin, so less radiation is blocked
- ❌ Mars is closer to the Sun than Earth
- ❌ The red dust is radioactive

**Reward:** 5 tech points + unlocks **Solar Storm Warnings** (DONKI data in the forecast)

**Real NASA fact:** Curiosity's **RAD** instrument measured about **0.67 millisieverts per day** on the surface of Mars. Inside the spacecraft on the way there it was about **1.8 per day**. NASA's **DONKI** database records the solar storms that make it worse.

**Trade-off:** The shelter is big and heavy, but when the Sun flares the crew has somewhere to hide. Safety costs cargo space.

**Sources:** [SwRI: First radiation measurements from the surface of Mars](https://www.swri.org/press-release/swri-scientists-publish-first-radiation-measurements-surface-mars) · [NASA DONKI space weather database](https://kauai.ccmc.gsfc.nasa.gov/DONKI/)

---

## Crew roster (who you can assign)

| Name | Role | Needed for |
|---|---|---|
| Ada | Engineer | Breathe Easy, Quake Listener |
| Kofi | Scientist | Storm Watch, Space Garden, Rock Collector, Radiation Detective |
| Omar | Scientist | (second scientist) |
| Lina | Medic | Radiation Detective |
| Yuki | Pilot | Sky Scout |

The player is the **captain** and stays at the station, answering the crew's Q&A calls.

## Cargo items used by these missions

| Item | Size (cells) | Gives | Based on |
|---|---|---|---|
| Food Pack | 1×1 | +4 Food/Water | |
| Oxygen Tank | 1×2 | +6 O2 | |
| Battery | 2×1 | +4 PwR, works in storms | |
| Solar Panel | 3×1 | +7 PwR, weak in storms and when dusty | Opportunity / InSight panels |
| Spare Parts | 1×1 | +2 RES | |
| Medkit | 1×1 | Treats injuries | |
| Dust Brush | 1×1 | Cleans panels | |
| Radiation Shelter | 2×2 | Protects in a solar storm | |
| Weather Station | T-shape (4) | | MEDA / REMS |
| Mini Helicopter | 5 cells | | Ingenuity |
| Survey Camera | 1×1 | | Mastcam-Z |
| Greenhouse Kit | 3×2 | | Veggie |
| Oxygen Maker | 2×2 | | MOXIE |
| Core Drill | 4×1 | | Perseverance drill |
| Sample Tube Case | 2×1 | | Perseverance sample tubes |
| Seismometer | 2×2 | | InSight SEIS |
| Radiation Detector | 1×1 | | Curiosity RAD |

Cargo bay: **8 × 6 = 48 cells**. All 7 missions fit, and the far missions are tight on purpose.

## Spare mission ideas (if we need more)

- **Ice Hunter:** ground radar and a drill at the crater rim. Based on Phoenix, which found water ice in 2008, and Perseverance's RIMFAX radar. ([NASA Astrobiology](https://astrobiology.nasa.gov/news/bright-chunks-at-phoenix-landers-mars-site-must-have-been-ice/))
- **Clues of Ancient Life:** sample the "leopard spot" rock Cheyava Falls. NASA called its sample a potential biosignature in 2025. ([NASA](https://www.nasa.gov/news-release/nasa-says-mars-rover-discovered-potential-biosignature-last-year/))
- **Hello, Earth!:** build a relay antenna. A message from Mars takes about 3 to 22 minutes to reach Earth. ([survey paper](https://arxiv.org/pdf/2211.14245))
- **Safe Landing Zone:** map a landing spot, the way Perseverance's Terrain-Relative Navigation used HiRISE maps. ([Univ. of Arizona](https://www.lpl.arizona.edu/news/spotlight/uarizona-led-hirise-camera-helped-guide-mars-rover-perfect-spot))

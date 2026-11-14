import { addSystemToSchedule, Schedule } from 'esengine';

import './components';
import { flightSystem } from './systems/flight';
import { prepSystem } from './prep/prepSystem';

// Main Game Shell + Sol Survival Loop (active in assets/scenes/main.esscene via GameRoot).
addSystemToSchedule(Schedule.Update, flightSystem);
// Mission Prep Scene (Pick Mission & Crew + Pack the Rocket, active in assets/scenes/mission-prep.esscene via PrepRoot).
addSystemToSchedule(Schedule.Update, prepSystem);

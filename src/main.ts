import { addSystemToSchedule, Schedule } from 'esengine';

import './components';
import { flightSystem } from './systems/flight';
import { prepSystem } from './prep/prepSystem';

addSystemToSchedule(Schedule.Update, flightSystem);
// Mission Prep (Pick Mission & Crew + Pack the Rocket). Only active in assets/scenes/mission-prep.esscene.
addSystemToSchedule(Schedule.Update, prepSystem);

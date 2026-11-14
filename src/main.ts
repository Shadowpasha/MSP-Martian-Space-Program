import { addSystemToSchedule, Schedule } from 'esengine';

import './components';
import { gameUiSystem } from './systems/gameUi';
import { prepSystem } from './prep/prepSystem';

addSystemToSchedule(Schedule.Update, gameUiSystem);
// Mission Prep (Pick Mission & Crew + Pack the Rocket). Only active in assets/scenes/mission-prep.esscene.
addSystemToSchedule(Schedule.Update, prepSystem);

import { addSystemToSchedule, Schedule } from 'esengine';

import './components';
import { audioBridgeSystem } from './systems/audioBridge';
import { flightSystem } from './systems/flight';

addSystemToSchedule(Schedule.Update, flightSystem);
addSystemToSchedule(Schedule.Update, audioBridgeSystem);

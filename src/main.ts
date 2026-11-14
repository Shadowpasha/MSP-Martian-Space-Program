import { addSystemToSchedule, Schedule } from 'esengine';

import './components';
import { flightSystem } from './systems/flight';

addSystemToSchedule(Schedule.Update, flightSystem);

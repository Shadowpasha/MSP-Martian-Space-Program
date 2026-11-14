import { addSystemToSchedule, Schedule } from 'esengine';

import './components';
import { flightSystem } from './systems/flight';
import { fitPlaytestCanvas } from './ui/playtestCanvas';

fitPlaytestCanvas();
addSystemToSchedule(Schedule.Update, flightSystem);

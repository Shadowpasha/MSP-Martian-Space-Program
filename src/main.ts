import { addSystemToSchedule, Schedule } from 'esengine';

import './components';
import { gameUiSystem } from './systems/gameUi';

addSystemToSchedule(Schedule.Update, gameUiSystem);

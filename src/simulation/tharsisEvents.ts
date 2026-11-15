import { EXPEDITIONS, expeditionOf, type Expedition } from '../data/expeditions';
import type { CargoItemId, ResourcePool } from '../contracts/gameContract';
import { CARGO_BY_ID } from '../data/cargo';
import { formatResource, missionDeadline, resourceEntries } from '../data/missions';
import { appendLog, applyResourceDelta, canAffordCost, clamp, resourceChanges, round1, spend } from './stateOps';
import { changeAreaMorale, localArea, stormDay, type Area, type TharsisState } from './tharsis';
import { ariesText } from './tharsisCustom';

interface EffectRule { resource?: keyof ResourcePool; amount?: number; morale?: number; radiation?: number; resetsSurvey?: boolean; }

const EFFECTS = {
    none: {},
    power_loss: { resource: 'energy', amount: -3 },
    water_loss: { resource: 'water', amount: -2 },
    oxygen_loss: { resource: 'oxygen', amount: -2 },
    food_loss: { resource: 'food', amount: -2 },
    materials_loss: { resource: 'res', amount: -1 },
    power_saved: { resource: 'energy', amount: 2 },
    water_recovered: { resource: 'water', amount: 2 },
    oxygen_saved: { resource: 'oxygen', amount: 2 },
    crew_confidence: { morale: 2 },
    crew_stress: { morale: -2 },
    exposure: { radiation: 3 },
    field_reset: { resetsSurvey: true },
} satisfies Record<string, EffectRule>;

const POSITIVE_BANDS: Record<string, readonly (keyof typeof EFFECTS)[]> = {
    'water reclamation': ['water_recovered'],
    'oxygen generator': ['oxygen_saved', 'power_saved'],
    'solar power': ['power_saved'],
    'crew health': [],
    'instrument checkout': ['power_saved'],
    'rover workshop': ['power_saved'],
    'food storage': [],
    'rover power': ['power_saved'],
    'rover oxygen': ['oxygen_saved'],
    'route communications': ['power_saved'],
    'field instrument': ['power_saved'],
    'field supplies': [],
    'field dosimetry': [],
};

const COMMITMENTS = {
    none: {}, power: { energy: 2 }, water: { water: 2 }, materials: { res: 1 },
} satisfies Record<string, Partial<ResourcePool>>;

const EVENT_CARGO = ['repairKits', 'medkits', 'batteryPacks', 'extraRations', 'waterCanisters', 'oxygenTanks'] as const;
export const allowedEventCargo = (cargo: Partial<Record<CargoItemId, number>>) => EVENT_CARGO.filter(id => (cargo[id] ?? 0) > 0);

export const EVENT_EFFECT_IDS = Object.keys(EFFECTS) as Array<keyof typeof EFFECTS>;
export const EVENT_COMMITMENT_IDS = Object.keys(COMMITMENTS) as Array<keyof typeof COMMITMENTS>;
export const EVENT_SYSTEMS = {
    station: ['water reclamation', 'oxygen generator', 'solar power', 'crew health', 'instrument checkout', 'rover workshop', 'food storage'],
    rover: ['rover power', 'rover oxygen', 'route communications', 'field instrument', 'field supplies', 'field dosimetry'],
} as const;

export function availableEffectIds(state: TharsisState): Array<keyof typeof EFFECTS> {
    return EVENT_EFFECT_IDS.filter(id => id !== 'field_reset' || state.tharsis.rover?.phase === 'site');
}

interface Effect {
    id: keyof typeof EFFECTS;
    severity: 1 | 2;
}

export interface SurveyChoice {
    action: string;
    detail: string;
    result: string;
    commitment: keyof typeof COMMITMENTS;
    effects: Effect[];
    cargo?: CargoItemId;
}

export interface SurveyBriefing {
    title: string;
    observation: string;
    system: string;
    area: Area;
    source: 'Mission control' | 'Local' | 'Gemini';
    choices: SurveyChoice[];
}

function choice(action: string, detail: string, result: string, id: Effect['id'], commitment: SurveyChoice['commitment'] = 'none', severity: Effect['severity'] = 1): SurveyChoice {
    return { action, detail, result, commitment, effects: [{ id, severity }] };
}

type LocalScenario = Pick<SurveyBriefing, 'title' | 'observation' | 'system' | 'choices'>;

const STATION_EVENTS: readonly LocalScenario[] = [
    {
        title: 'Water quality drift', system: 'water reclamation',
        observation: 'Conductivity rose immediately after the processor changed beds. The backup sample from the clean tank reads normal.',
        choices: [
            choice('Isolate and reprocess', 'Divert the suspect stream back through the processor.', 'The second pass brought the diverted water into spec.', 'water_recovered', 'power'),
            choice('Flush the clean tank', 'Purge stored water and refill the feed line.', 'The clean water went to waste. The suspect stream was still upstream.', 'water_loss', 'water', 2),
            choice('Switch to test samples', 'Keep the outlet closed and watch a second cycle.', 'A second test narrowed the fault while the crew waited for the outlet.', 'crew_stress'),
        ],
    },
    {
        title: 'Solar strings falling out of step', system: 'solar power',
        observation: 'One string drops under load. Its neighboring strings have the same dust coating, and their output stayed steady.',
        choices: [
            choice('Isolate the weak string', 'Transfer the load and check the connector.', 'A high-resistance connector was bypassed before it drained the bus.', 'power_saved'),
            choice('Run full-array cleaning', 'Power the cleaning cycle across all strings.', 'Cleaning burned battery power. The connector fault remained.', 'power_loss', 'power', 2),
        ],
    },
    {
        title: 'Oxygen cell current rises', system: 'oxygen generator',
        observation: 'The cell stack draws more current after its inlet pump starts. The cabin pressure trace holds steady.',
        choices: [
            choice('Inspect the inlet screen', 'Check for restriction upstream of the cell stack.', 'The crew cleared the restriction and restored output.', 'oxygen_saved', 'power'),
            choice('Vent and retest the cabin', 'Run a full cabin pressure check.', 'The cabin was tight. The pressure test used reserve oxygen.', 'oxygen_loss', 'none', 2),
            choice('Hold the stack in standby', 'Use reserve air while checking the pump trace.', 'Standby kept the pump offline while the crew reviewed the trace.', 'none'),
        ],
    },
    {
        title: 'Instrument readings disagree', system: 'instrument checkout',
        observation: 'The readings jump every time the air fan changes speed, while the backup sensor stays steady.',
        choices: [
            choice('Shield the sensor from airflow', 'Repeat the check with the sensor blocked from the fan breeze.', 'Blocking the breeze stopped the wobble.', 'crew_confidence'),
            choice('Swap the wiring harness', 'Use a spare cable to rewire the sensor.', 'The new cable showed the same breeze wobble and used a spare part.', 'materials_loss', 'materials'),
        ],
    },
    {
        title: 'Greenhouse misting timer', system: 'food storage',
        observation: 'The plant tray leaves look dry on one side, even though the water tank level is full.',
        choices: [
            choice('Unclog the spray nozzle', 'Wipe the dust off the misting nozzle.', 'Water sprayed evenly across all the plants again.', 'water_recovered'),
            choice('Double the watering timer', 'Pump extra water into the whole tray.', 'Half the extra water pooled on the floor and went to waste.', 'water_loss', 'water'),
        ],
    },
    {
        title: 'Airlock door seal frost', system: 'oxygen generator',
        observation: 'Thin white frost formed on the outer airlock rubber ring after last night\'s cold snap.',
        choices: [
            choice('Warm and wipe the seal', 'Use a warm cloth to clear the ice gently.', 'The door sealed tight and kept all the station air inside.', 'oxygen_saved'),
            choice('Force the latch shut', 'Pull the heavy handle harder to close the gap.', 'The stiff ring pinched and leaked a puff of air.', 'oxygen_loss'),
        ],
    },
    {
        title: 'Battery warming pad alert', system: 'solar power',
        observation: 'Battery Bank 2 feels cooler than Bank 1, but its voltage is still green.',
        choices: [
            choice('Wrap it with foam insulation', 'Tuck a spare thermal blanket around the case.', 'The battery stayed warm without spending extra power.', 'power_saved'),
            choice('Turn the heater to max', 'Run the electric heater on high all afternoon.', 'The battery warmed up, but the heater drained the reserves.', 'power_loss', 'power'),
        ],
    },
    {
        title: 'Dust on the roof skylight', system: 'crew health',
        observation: 'Red Mars dust dimmed the mess hall window, making the station feel gloomy.',
        choices: [
            choice('Brush off the glass', 'Send a suited crew member out for a quick wipe.', 'Bright sunlight poured back in and cheered everyone up.', 'crew_confidence'),
            choice('Leave it until next week', 'Keep everyone inside and switch on dim night lights.', 'The dark hall made the crew feel cooped up.', 'crew_stress'),
        ],
    },
    {
        title: 'Loose rover wheel lug', system: 'rover workshop',
        observation: 'During a quick garage look, one wheel bolt on the rover looks half a turn loose.',
        choices: [
            choice('Tighten it with a torque wrench', 'Check all six wheels while the wrench is out.', 'Every wheel bolt is snug and ready for rocky ground.', 'crew_confidence'),
            choice('Swap out the whole hub', 'Take off the wheel and fit a spare hub.', 'The old hub was fine, so the swap wasted spare parts.', 'materials_loss', 'materials'),
        ],
    },
    {
        title: 'Freezer latch popped open', system: 'food storage',
        observation: 'The snack locker door clicked open an inch, letting warm cabin air drift inside.',
        choices: [
            choice('Re-latch and check seals', 'Clean the magnetic strip and close it firmly.', 'The food stayed frozen and nothing spoiled.', 'none'),
            choice('Toss the top shelf packs', 'Throw away the slightly soft packs just in case.', 'The packs were still cold enough, so good food was wasted.', 'food_loss'),
        ],
    },
    {
        title: 'Water pump hums loudly', system: 'water reclamation',
        observation: 'The main water pump is buzzing louder than usual, though water flow is still normal.',
        choices: [
            choice('Tighten the rubber mounts', 'Add a small pad under the vibrating bracket.', 'The hum vanished and the pump used less power.', 'power_saved'),
            choice('Drain and flush the loop', 'Empty the pipes to look for bubbles.', 'No bubbles were found, and two liters of water were lost.', 'water_loss'),
        ],
    },
    {
        title: 'Solar tracker stuck east', system: 'solar power',
        observation: 'One solar wing stopped following the sun across the sky at noon.',
        choices: [
            choice('Clear grit from the gear', 'Brush red dust off the turning track.', 'The wing swung back toward the sun and boosted power.', 'power_saved'),
            choice('Run the motor at double voltage', 'Try to power through the jammed gear.', 'The motor overheated and tripped a breaker.', 'power_loss', 'power'),
        ],
    },
    {
        title: 'CO2 scrubber filter full', system: 'oxygen generator',
        observation: 'The air feels slightly stuffy in the lab because the scrubber cartridge is near its limit.',
        choices: [
            choice('Bake and reuse the cartridge', 'Run the normal heat-clean cycle.', 'Fresh air returned without spending reserve tanks.', 'oxygen_saved', 'power'),
            choice('Crack open an O2 reserve', 'Dump extra oxygen into the room instead.', 'The air cleared briefly, but reserve tanks dropped.', 'oxygen_loss'),
        ],
    },
    {
        title: 'Exercise bike belt slips', system: 'crew health',
        observation: 'The crew\'s daily workout bike keeps slipping a tooth when pedaling hard.',
        choices: [
            choice('Adjust the belt tension', 'Spend ten minutes tightening the pulley screw.', 'Smooth workouts kept everyone\'s spirits high.', 'crew_confidence'),
            choice('Skip workouts today', 'Leave the bike broken until a slow day.', 'Without exercise, the crew felt sluggish and grumpy.', 'crew_stress'),
        ],
    },
    {
        title: '3D printer nozzle jam', system: 'rover workshop',
        observation: 'A small plastic bracket stopped printing halfway through.',
        choices: [
            choice('Heat and clear the tip', 'Warm the nozzle and push the tiny plug out.', 'The print finished cleanly without wasting filament.', 'none'),
            choice('Scrap the spool and restart', 'Pull out the whole spool and start fresh.', 'A batch of useful building material went into the bin.', 'materials_loss'),
        ],
    },
    {
        title: 'Dusty radio dish', system: 'instrument checkout',
        observation: 'Static crackled during morning check-in with Earth.',
        choices: [
            choice('Check the cable plug', 'Wiggle and lock the indoor antenna plug.', 'Crystal-clear voices came right back.', 'crew_confidence'),
            choice('Crank the dish amplifier', 'Push maximum power into the dish.', 'The static was just a loose plug, so extra power was wasted.', 'power_loss'),
        ],
    },
    {
        title: 'Cold floor in bunk room', system: 'crew health',
        observation: 'One sleeping pod feels chilly because a floor vent is blocked by a supply crate.',
        choices: [
            choice('Move the supply crate', 'Slide the crate two feet so warm air flows.', 'The bunk warmed right up and everyone slept great.', 'crew_confidence'),
            choice('Plug in a space heater', 'Leave the crate and run an extra heater.', 'The room warmed up, but the heater pulled extra power.', 'power_loss'),
        ],
    },
    {
        title: 'Greywater filter indicator', system: 'water reclamation',
        observation: 'A yellow light says the sink water filter is getting slow.',
        choices: [
            choice('Backwash the mesh screen', 'Run clean air backward through the screen.', 'Water flowed fast again and saved two liters.', 'water_recovered'),
            choice('Bypass into waste tank', 'Skip filtering today\'s wash water.', 'Skipping the loop cost the station clean water.', 'water_loss'),
        ],
    },
    {
        title: 'Spare suit glove tear', system: 'rover workshop',
        observation: 'A tiny scuff appeared on the outer layer of a spare spacewalk glove.',
        choices: [
            choice('Patch it with tape', 'Seal the scuff cleanly with tough repair tape.', 'The glove passed its pressure check.', 'none'),
            choice('Throw out the glove pair', 'Unpack a brand-new set from storage.', 'Tossing a fixable glove wasted precious materials.', 'materials_loss'),
        ],
    },
];

const ROVER_EVENTS: readonly LocalScenario[] = [
    {
        title: 'Rover voltage dip', system: 'rover power',
        observation: 'The bus dips only when the cabin heater and telemetry transmitter start together. The battery holds steady at idle.',
        choices: [
            choice('Stagger the starts', 'Transmit after the heater startup cycle.', 'Separating the loads kept the bus within limits.', 'power_saved'),
            choice('Run the full-load test', 'Repeat both starts together to reproduce the fault.', 'The bus dropped again and drained the reserve.', 'power_loss', 'power'),
        ],
    },
    {
        title: 'Radio echo across the ridge', system: 'route communications',
        observation: 'The call cuts out just beyond a ridge shoulder. The antenna self-test and line voltages both pass.',
        choices: [
            choice('Use the scheduled link window', 'Wait for the line-of-sight relay pass.', 'The link cleared as the relay passed overhead.', 'none'),
            choice('Boost transmitter power', 'Hold the transmitter at full power.', 'The terrain still blocked the signal, and the transmitter drained the battery.', 'power_loss', 'power'),
        ],
    },
    {
        title: 'Cabin pressure reading drops', system: 'rover oxygen',
        observation: 'The digital gauge dips during radio transmissions. The independent mechanical gauge stays level.',
        choices: [
            choice('Check the independent gauge', 'Compare both instruments with the radio off.', 'The mechanical gauge confirmed that cabin pressure was stable.', 'none'),
            choice('Purge the cabin', 'Cycle the cabin air to retest pressure.', 'The gauge interference persisted. The purge used field oxygen.', 'oxygen_loss', 'none', 2),
        ],
    },
    {
        title: 'Canteen condensation', system: 'field supplies',
        observation: 'Droplets are on the outside of a cold water canister. The seal mark still lines up and the fill level is stable.',
        choices: [
            choice('Check the seal mark', 'Dry the canister and compare it to the fill log.', 'Water stopped appearing after the canister warmed up.', 'none'),
            choice('Discard the suspect water', 'Empty the canister before it can contaminate the supply.', 'The seal was sound. Potable water was discarded.', 'water_loss'),
        ],
    },
    {
        title: 'Steep sandy slope ahead', system: 'rover power',
        observation: 'Soft red sand covers the shortcut up the ridge. The flat path around takes ten minutes longer.',
        choices: [
            choice('Take the firmer flat path', 'Drive around the loose sand on solid rock.', 'The wheels gripped well and saved battery power.', 'power_saved'),
            choice('Climb straight through the sand', 'Push full power up the soft slope.', 'Spinning wheels burned extra battery power.', 'power_loss', 'power'),
        ],
    },
    {
        title: 'Dusty rover camera lens', system: 'field instrument',
        observation: 'A smudge of Martian dust blurs the rover\'s front navigation camera.',
        choices: [
            choice('Use the air puff nozzle', 'Blast a tiny puff of compressed air across the lens.', 'The picture cleared right up.', 'none'),
            choice('Switch on high-beam floodlights', 'Try to see through the blur with bright lamps.', 'The glare made the blur worse and used battery power.', 'power_loss'),
        ],
    },
    {
        title: 'Bumpy rock field', system: 'field supplies',
        observation: 'A rattling sound comes from the rover cargo rack as it crosses sharp stones.',
        choices: [
            choice('Stop and cinch the strap', 'Pull the cargo strap one notch tighter.', 'Everything rode quietly and safely.', 'none'),
            choice('Keep driving fast', 'Ignore the rattle to save time.', 'A water bottle bounced loose and cracked.', 'water_loss'),
        ],
    },
    {
        title: 'Warm cabin air', system: 'rover oxygen',
        observation: 'The rover cabin feels a bit warm with both crew members working hard inside.',
        choices: [
            choice('Dial down the heater', 'Lower the thermostat two degrees.', 'The cabin cooled down and saved power.', 'power_saved'),
            choice('Vent cabin air outside', 'Open a small valve to swap warm air.', 'Letting air out wasted precious rover oxygen.', 'oxygen_loss'),
        ],
    },
    {
        title: 'Tiny pebble in wheel tread', system: 'rover power',
        observation: 'A sharp pebble wedged into the metal tread of the front-left wheel.',
        choices: [
            choice('Back up slowly to pop it', 'Reverse two meters over a flat rock.', 'The pebble dropped right out.', 'none'),
            choice('Power forward over boulders', 'Try to crush the pebble by driving harder.', 'The motor worked overtime and drained the battery.', 'power_loss'),
        ],
    },
    {
        title: 'Radiation badge beep', system: 'field dosimetry',
        observation: 'A pocket radiation badge chirped once when passing a sunny gap in the canyon.',
        choices: [
            choice('Park in rock shadow', 'Pause for a few minutes behind a tall boulder.', 'The shadow blocked the burst and kept the crew safe.', 'none'),
            choice('Step out to check the sensor', 'Open the hatch to inspect the outside sensor.', 'Stepping outside gave the crew extra radiation.', 'exposure'),
        ],
    },
    {
        title: 'Snack pack vacuum seal', system: 'field supplies',
        observation: 'One ration pouch puffed up slightly because the rover cabin pressure is lower than Earth.',
        choices: [
            choice('Check the date and eat normally', 'Puffed bags are normal in lower cabin pressure.', 'The food was fresh and kept the crew energized.', 'crew_confidence'),
            choice('Toss the puffed pouch', 'Throw it out thinking it went bad.', 'Good food was thrown away by mistake.', 'food_loss'),
        ],
    },
    {
        title: 'Orbiter pass timing', system: 'route communications',
        observation: 'The Mars orbiter is about to pass overhead for a fast data upload.',
        choices: [
            choice('Send compressed summary first', 'Send the key numbers while the signal is strongest.', 'The upload finished fast and saved battery.', 'power_saved'),
            choice('Send raw video files', 'Try to push huge video files at low angle.', 'The link dropped halfway and drained the transmitter.', 'power_loss'),
        ],
    },
    {
        title: 'Frost on outside sample box', system: 'field instrument',
        observation: 'Morning frost dusted the lid of the outside science box.',
        choices: [
            choice('Wait for midday sun', 'Let sunlight warm the lid naturally.', 'The lid opened smoothly without using battery heat.', 'power_saved'),
            choice('Use the electric de-icer', 'Melt the frost with the high-power heater.', 'The heater cleared it fast but spent reserve power.', 'power_loss'),
        ],
    },
    {
        title: 'Squeaky rover steering', system: 'rover power',
        observation: 'The front steering joint squeaks when turning left.',
        choices: [
            choice('Take wider gentle turns', 'Steer smoothly around rocks instead of sharp turns.', 'The joint stayed quiet and smooth.', 'none'),
            choice('Lock into crab-walk mode', 'Run all four wheel motors sideways.', 'Running all motors sideways drained extra battery.', 'power_loss'),
        ],
    },
    {
        title: 'Air filter dust warning', system: 'rover oxygen',
        observation: 'Fine Martian dust is building up on the rover\'s cabin intake screen.',
        choices: [
            choice('Tap the dust trap clean', 'Empty the collection cup inside the airlock.', 'Clean air flowed freely again.', 'oxygen_saved'),
            choice('Open the emergency O2 bottle', 'Ignore the filter and add bottle oxygen.', 'Oxygen from the emergency tank was wasted.', 'oxygen_loss'),
        ],
    },
    {
        title: 'Bright sunset glare', system: 'field supplies',
        observation: 'Low afternoon sunlight shines straight into the driver\'s visor.',
        choices: [
            choice('Flip down the gold sun visor', 'Use the built-in tinted shield.', 'The trail ahead was easy to see and fun to drive.', 'crew_confidence'),
            choice('Squint and drive on', 'Keep going without lowering the visor.', 'Driving in glare tired out the crew.', 'crew_stress'),
        ],
    },
    {
        title: 'Sample tray latch sticky', system: 'field instrument',
        observation: 'Fine dust made the sample drawer slide stiff.',
        choices: [
            choice('Brush the rail gently', 'Wipe the metal rail before sliding the drawer.', 'The drawer clicked shut cleanly.', 'none'),
            choice('Hammer the drawer shut', 'Push hard to force the latch.', 'A small bracket bent and needed spare parts.', 'materials_loss'),
        ],
    },
    {
        title: 'Coolant pipe rattle', system: 'rover power',
        observation: 'A thin cooling tube taps against the rover frame on bumpy ground.',
        choices: [
            choice('Clip it into its holder', 'Snap the tube back into the plastic clip.', 'The tapping stopped and cooling stayed steady.', 'none'),
            choice('Turn off the cooling pump', 'Shut down the pump to stop the noise.', 'The rover ran hot and wasted power.', 'power_loss'),
        ],
    },
    {
        title: 'Surprise meteorite', system: 'field instrument',
        observation: 'A shiny dark iron rock sits right beside the rover trail.',
        choices: [
            choice('Snap a quick photo from the cab', 'Log the GPS spot and photograph it through the window.', 'Mission control loved the bonus science find.', 'crew_confidence'),
            choice('Stop and dig for an hour', 'Pause the schedule to chip off a chunk.', 'Digging delayed the crew and tired them out.', 'crew_stress'),
        ],
    },
];

const LANDING_EVENTS: readonly LocalScenario[] = [
    {
        title: 'Touchdown dust on the solar wings', system: 'solar power',
        observation: 'Landing thrusters kicked up a puff of fine red dust onto the station panels.',
        choices: [
            choice('Sweep with the air blower', 'Use a quick burst of cabin air to clear the wings.', 'Sunlight hit the clean panels at full strength.', 'power_saved'),
            choice('Leave the dust for the wind', 'Save your breath and wait for Martian wind.', 'The panels stayed dusty and lost a bit of power.', 'power_loss'),
        ],
    },
    {
        title: 'Landing leg weight check', system: 'mission control',
        observation: 'One landing foot settled on a flat Mars rock, tilting the floor a tiny bit.',
        choices: [
            choice('Level the jack screw', 'Turn the manual foot screw two clicks.', 'The floor sits flat and steady.', 'crew_confidence'),
            choice('Run full hydraulic leveling', 'Fire the electric leveling motors on all four legs.', 'The motors worked fine, but burned extra battery power.', 'power_loss', 'power'),
        ],
    },
    {
        title: 'Radio dish wake-up', system: 'route communications',
        observation: 'After landing, the Earth dish is pointing slightly west of the relay satellite.',
        choices: [
            choice('Nudge the dish by hand-crank', 'Turn the small aim wheel two notches east.', 'Earth came through loud and clear.', 'crew_confidence'),
            choice('Boost signal power', 'Leave the dish aimed off-center and crank the amp.', 'Cranking the amp drained station power.', 'power_loss', 'power'),
        ],
    },
    {
        title: 'Warm cabin after entry', system: 'oxygen generator',
        observation: 'Dropping through the sky warmed the station hull, making the cabin feel toasty.',
        choices: [
            choice('Open the radiator shade', 'Let the cold Mars air outside cool the radiator fins.', 'The cabin cooled down nicely without spending power.', 'power_saved'),
            choice('Run the electric chiller', 'Switch on the indoor cooling fan on high.', 'The electric chiller cooled the room, but used reserve power.', 'power_loss', 'power'),
        ],
    },
    {
        title: 'Rover ramp latch', system: 'rover workshop',
        observation: 'The garage ramp door clicked halfway open after touchdown.',
        choices: [
            choice('Clear pebbles from the hinge', 'Brush away two little stones under the ramp.', 'The ramp dropped smoothly into place.', 'none'),
            choice('Force the winch motor', 'Keep pulling the electric winch until it snaps past.', 'The winch strained and burned extra battery.', 'power_loss', 'power'),
        ],
    },
    {
        title: 'Water tank bubbles', system: 'water reclamation',
        observation: 'Shaking during landing stirred tiny air bubbles into the main water pipe.',
        choices: [
            choice('Bleed the air valve slowly', 'Open the top vent for two seconds until water appears.', 'Clean water flowed smoothly with zero waste.', 'water_recovered'),
            choice('Flush the whole pipe', 'Pump out the first two liters into the drain.', 'The bubbles cleared, but two liters of clean water were lost.', 'water_loss'),
        ],
    },
    {
        title: 'Snack locker rattle', system: 'food storage',
        observation: 'A bumpy touchdown knocked two ration boxes off the top shelf.',
        choices: [
            choice('Stack and strap the boxes', 'Put the boxes back and snap the bungee cord.', 'Everything is neat and easy to reach.', 'crew_confidence'),
            choice('Leave them piled by the door', 'Step over the boxes until later.', 'Tripping around the boxes slowed the crew down.', 'crew_stress'),
        ],
    },
    {
        title: 'First look out the window', system: 'crew health',
        observation: 'The dust settled outside, showing pink skies and red ridges all around.',
        choices: [
            choice('Snap a crew arrival photo', 'Take one quick picture together before starting work.', 'Everyone smiled and felt ready for the mission.', 'crew_confidence'),
            choice('Skip the break and rush', 'Tell everyone to ignore the view and start immediately.', 'Rushing right after landing made the crew tense.', 'crew_stress'),
        ],
    },
    {
        title: 'Airlock pressure test', system: 'oxygen generator',
        observation: 'Mission control wants a quick check that the front hatch sealed tight after landing.',
        choices: [
            choice('Read the door seal gauge', 'Check the built-in dial on the hatch frame.', 'The dial stayed steady in the green zone.', 'oxygen_saved'),
            choice('Pump in extra test air', 'Raise cabin pressure higher to double-check.', 'Overfilling the cabin vented extra oxygen outside.', 'oxygen_loss'),
        ],
    },
    {
        title: 'Science rack tie-down', system: 'instrument checkout',
        observation: 'Foam pads still wrap the rover weather and science tools from the rocket ride.',
        choices: [
            choice('Unpack and stow the foam', 'Carefully pull off the pads and tuck them into recycling.', 'Every tool is ready and undamaged.', 'crew_confidence'),
            choice('Cut the straps in a hurry', 'Slice the shipping straps without checking the sensors.', 'A small bracket nicked and needed a spare part.', 'materials_loss'),
        ],
    },
];

export function authoredBriefing(
    sol: number, area: Area, seed: number, storm: 'onset' | 'peak' | 'clearing' | null,
    expedition: Expedition = EXPEDITIONS.tharsis, deadline = 16, atSurveySite = false,
): SurveyBriefing {
    if (sol === 1) {
        const missionLine = expedition.intro.replace('{deadline}', String(deadline));
        if (expedition.id === 'training') {
            return {
                title: `${expedition.region} flight briefing`, system: 'mission control', area, source: 'Mission control',
                observation: missionLine,
                choices: [
                    choice('Check the maintenance log', 'Review the landing diagnostics before scheduling checks.', 'The readings are consistent with a clean landing.', 'crew_confidence'),
                    choice('Repeat the full power test', 'Run the lander’s full-load test one more time.', 'The second test found no new fault and used station power.', 'power_loss', 'power'),
                ],
            };
        }
        const landing = LANDING_EVENTS[(seed >>> 0) % LANDING_EVENTS.length]!;
        const rotation = ((seed >>> 0) >>> 4) % landing.choices.length;
        return {
            title: landing.title,
            system: landing.system,
            area,
            source: 'Mission control',
            observation: `${landing.observation} ${missionLine}`,
            choices: [...landing.choices.slice(rotation), ...landing.choices.slice(0, rotation)],
        };
    }
    if (expedition.id === 'training') return trainingBriefing(sol, area, atSurveySite);
    if (storm && expedition.hazard.kind === 'solar') {
        const title = storm === 'onset' ? 'Solar particle storm' : storm === 'peak' ? 'Storm at peak flux' : 'Last Sol of the storm';
        const observation = area === 'rover'
            ? 'Particle counts are climbing fast. A standard rover must shelter. A hardened rover can operate if the batteries cover the extra monitoring load.'
            : 'Particle counts are climbing fast and will peak on the second Sol. Activate shelter in Life Support to limit exposure. The array is still generating at its usual rate.';
        return { title, observation, system: 'storm', area, source: 'Mission control', choices: [
            choice('Isolate nonessential circuits', 'Use the low-load storm checklist.', 'The lower electrical load preserved reserve power.', 'power_saved'),
            choice('Run at full output', 'Keep all lights, transmitters, and work circuits live.', 'The extra load drained reserves during the alert.', 'power_loss', 'none', 2),
        ] };
    }
    if (storm) {
        const title = storm === 'onset' ? 'Regional dust storm' : storm === 'peak' ? 'Storm at peak opacity' : 'Last Sol under dust';
        const observation = area === 'rover'
            ? 'Visibility is restricted and the cabin is cooling. A standard rover must shelter. A hardened rover can operate if its Power and O₂ cover the heaters and filters.'
            : 'Dust is blocking sunlight, temperatures are falling, and particle counts are rising. Activate shelter in Life Support and check heater and filter loads in Conditions.';
        return { title, observation, system: 'storm', area, source: 'Mission control', choices: [
            choice('Isolate nonessential circuits', 'Use the low-load storm checklist.', 'The lower electrical load preserved reserve power.', 'power_saved'),
            choice('Run at full output', 'Keep all lights, transmitters, and work circuits live.', 'The extra load drained reserves during the alert.', 'power_loss', 'none', 2),
        ] };
    }
    const deck = [...(area === 'station' ? STATION_EVENTS : ROVER_EVENTS)];
    let rng = ((seed >>> 0) ^ (area === 'station' ? 0x517cc1b7 : 0x85ebca6b)) >>> 0;
    for (let i = deck.length - 1; i > 0; i--) {
        rng = (Math.imul(rng, 1664525) + 1013904223) >>> 0;
        const j = rng % (i + 1);
        [deck[i], deck[j]] = [deck[j]!, deck[i]!];
    }
    const index = Math.max(0, sol - 2) % deck.length;
    const scenario = deck[index]!;
    const rotation = ((seed >>> 0) + sol) % scenario.choices.length;
    return { ...scenario, choices: [...scenario.choices.slice(rotation), ...scenario.choices.slice(0, rotation)], area, source: 'Local' };
}

function trainingBriefing(sol: number, area: Area, atSurveySite: boolean): SurveyBriefing {
    const source = 'Mission control';
    if (area === 'rover') {
        if (atSurveySite) return {
            title: 'Intermittent instrument signal', system: 'field instrument', area, source,
            observation: 'The logger is recording, but the relay link flickers whenever the connector moves.',
            choices: [
                choice('Re-seat the relay connector', 'Keep the logger running while checking the relay connection.', 'The link is steady. The logger can keep sampling.', 'none'),
                choice('Cold reboot the logger', 'Disconnect the instrument and reset its acquisition system.', 'The logger needs the rest of this Sol to restart.', 'field_reset'),
            ],
        };
        return {
            title: 'Routine rover contact', system: 'route communications', area, source,
            observation: 'Mission control confirms the route and your next check-in. The primary radio is working.',
            choices: [
                choice('Acknowledge on the primary radio', 'Keep the backup set in reserve.', 'Mission control received the check-in.', 'none'),
                choice('Test the backup transmitter', 'Power the spare radio and repeat the check-in.', 'The spare test drained the rover battery without improving reception.', 'power_loss'),
            ],
        };
    }
    if (sol === 3) return {
        title: 'Oxygen reserve check', system: 'oxygen generator', area, source,
        observation: 'Cabin pressure is steady. The departure load and station upkeep will draw on the same oxygen stock.',
        choices: [
            choice('Confirm pressure and check reserves', 'Review usable oxygen and the planned rover load.', 'The readings agree. Use the station forecast to prepare for docking.', 'none'),
            choice('Vent and retest the line', 'Purge atmosphere to repeat the pressure measurement.', 'The pressure was already stable. The retest used oxygen.', 'oxygen_loss'),
        ],
    };
    return {
        title: 'Station systems check', system: 'solar power', area, source,
        observation: 'The station is operating normally. Check the remaining mission objectives before scheduling work.',
        choices: [
            choice('Review the shift log', 'Confirm the last checks and keep the station at normal load.', 'The logged measurements are in range.', 'none'),
            choice('Run full-load diagnostics', 'Power all test circuits to confirm the same readings.', 'The diagnostics agreed with the log and used reserve power.', 'power_loss', 'power'),
        ],
    };
}

export function nextBriefing(state: TharsisState): SurveyBriefing {
    const day = stormDay(state);
    return authoredBriefing(state.sol, state.tharsis.rover ? 'rover' : 'station', state.tharsis.seed,
        day === 1 ? 'onset' : day === 2 ? 'peak' : day === 3 ? 'clearing' : null,
        expeditionOf(state.tharsis.expedition), missionDeadline(state), state.tharsis.rover?.phase === 'site');
}

export function commitmentLabel(choice: SurveyChoice): string {
    return [...resourceEntries(COMMITMENTS[choice.commitment]).map(([key, amount]) => formatResource(key, amount)),
        ...(choice.cargo ? [CARGO_BY_ID[choice.cargo].name] : [])].join(' · ');
}

export function choiceBlock(state: TharsisState, choice: SurveyChoice): string | null {
    const local = localArea(state, state.tharsis.briefing.area);
    if (!local) return 'This location is no longer available.';
    if (!canAffordCost(local.resources, COMMITMENTS[choice.commitment])) return `Needs ${commitmentLabel(choice)}`;
    if (choice.cargo && !local.cargo[choice.cargo]) return `Needs ${CARGO_BY_ID[choice.cargo].name}`;
    return null;
}

export function validateBriefing(value: unknown, state: TharsisState): SurveyBriefing | null {
    if (!value || typeof value !== 'object') return null;
    const area = state.tharsis.briefing.area;
    const local = localArea(state, area);
    if (!local) return null;
    const raw = value as Record<string, unknown>;
    const title = ariesText(raw.title, 52);
    const observation = ariesText(raw.observation, 310);
    const system = typeof raw.system === 'string' && (EVENT_SYSTEMS[area] as readonly string[]).includes(raw.system) ? raw.system : null;
    if (!title || !observation || !system || state.tharsis.recentSystems.slice(-2).includes(system) ||
        !Array.isArray(raw.choices) || raw.choices.length < 2 || raw.choices.length > 3) return null;
    const choices: SurveyChoice[] = [];
    const effectsForArea = availableEffectIds(state);
    for (const candidate of raw.choices as unknown[]) {
        if (!candidate || typeof candidate !== 'object') return null;
        const item = candidate as Record<string, unknown>;
        const action = ariesText(item.action, 48);
        const detail = ariesText(item.detail, 126);
        const result = ariesText(item.result, 150);
        const commitment = EVENT_COMMITMENT_IDS.find(id => id === item.commitment);
        const cargo = allowedEventCargo(local.cargo).find(id => id === item.cargo);
        if (!action || !detail || !result || !commitment || (item.cargo && item.cargo !== 'none' && !cargo) ||
            !Array.isArray(item.effects) || item.effects.length < 1 || item.effects.length > 2) return null;
        const effects: Effect[] = [];
        for (const effect of item.effects as unknown[]) {
            if (!effect || typeof effect !== 'object') return null;
            const { id: requested, severity } = effect as Record<string, unknown>;
            const id = effectsForArea.find(id => id === requested);
            if (!id || (severity !== 1 && severity !== 2) || effects.some(effect => effect.id === id)) return null;
            const rule: EffectRule = EFFECTS[id];
            if ((rule.amount ?? 0) > 0 && !POSITIVE_BANDS[system]?.includes(id)) return null;
            if (rule.resetsSurvey && (severity !== 1 || (system !== 'field instrument' && system !== 'route communications'))) return null;
            effects.push({ id, severity });
        }
        if (effects.length > 1 && effects.some(({ id }) => id === 'none')) return null;
        if (choices.some(choice => choice.action.toLowerCase() === action.toLowerCase())) return null;
        choices.push({ action, detail, result, commitment, cargo, effects });
    }
    const free = choices.some(choice => choice.commitment === 'none' && !choice.cargo &&
        !choice.effects.some(({ id }) => {
            const effect: EffectRule = EFFECTS[id];
            return (effect.amount ?? 0) < 0 || (effect.radiation ?? 0) > 0 || (effect.morale ?? 0) < 0 || effect.resetsSurvey;
        }));
    const distinct = new Set(choices.map(choice => JSON.stringify([choice.commitment, choice.cargo, [...choice.effects].sort((a, b) => a.id.localeCompare(b.id))])));
    return free && distinct.size > 1 ? { title, observation, system, area, source: 'Gemini', choices } : null;
}

export function allowedPositiveEffects(system: string): readonly string[] {
    return POSITIVE_BANDS[system] ?? [];
}

export function captainCanPreview(state: TharsisState): boolean {
    return state.tharsis.phase === 'briefing' && Boolean(localArea(state, state.tharsis.briefing.area)?.crew
        .some(member => member.role === 'captain' && member.health > 0));
}

export function selectBriefingPreview(state: TharsisState, index: number): string | null {
    if (!captainCanPreview(state)) return 'A living Captain must be at this briefing location.';
    const run = state.tharsis;
    if (run.previewedChoice !== null) return 'The Captain has previewed one response this briefing.';
    const choice = run.briefing.choices[index];
    if (!choice) return 'Choose a briefing response.';
    const blocker = choiceBlock(state, choice);
    if (blocker) return blocker;
    run.previewedChoice = index;
    return null;
}

export function briefingPreview(state: TharsisState): { choice: SurveyChoice; outcome: readonly string[] } | null {
    const index = state.tharsis.previewedChoice;
    if (index === null || state.tharsis.phase !== 'briefing') return null;
    const choice = state.tharsis.briefing.choices[index]!;
    return { choice, outcome: applyBriefingChoice(structuredClone(state), choice) };
}

function applyBriefingChoice(state: TharsisState, choice: SurveyChoice): string[] {
    const run = state.tharsis;
    const { resources, conditions, cargo, crew } = localArea(state, run.briefing.area)!;
    const before = { ...resources };
    const moraleBefore = conditions.morale;
    const radiationBefore = conditions.radiation;
    spend(resources, COMMITMENTS[choice.commitment]);
    if (choice.cargo) cargo[choice.cargo]--;
    for (const effect of choice.effects) {
        const change: EffectRule = EFFECTS[effect.id];
        if (change.resource && change.amount) applyResourceDelta(resources, { [change.resource]: change.amount * effect.severity });
        if (change.morale) changeAreaMorale(crew, conditions, change.morale * effect.severity * (change.morale < 0 ? state.skillModifiers.moraleDecayMult : 1));
        if (change.radiation) conditions.radiation = clamp(round1(conditions.radiation + change.radiation * effect.severity * (1 - state.skillModifiers.radiationShielding)), 0, 100);
        if (change.resetsSurvey && run.rover?.phase === 'site') run.rover.interrupted = true;
    }
    const measured = resourceChanges(before, resources, run.briefing.area === 'rover');
    const morale = round1(conditions.morale - moraleBefore);
    const dose = round1(conditions.radiation - radiationBefore);
    const signed = (delta: number) => `${delta > 0 ? '+' : ''}${delta}`;
    const changes = [measured, morale ? `${signed(morale)} Morale` : '', dose ? `${signed(dose)} mSv` : '', choice.cargo ? `Used ${CARGO_BY_ID[choice.cargo].name}` : '',
        run.rover?.interrupted ? 'Field collection unavailable this Sol' : ''].filter(Boolean);
    return [choice.result, changes.join(' · ') || 'No measured change in supplies or conditions.'];
}

export function resolveBriefing(state: TharsisState, index: number): string | null {
    const run = state.tharsis;
    const choice = run.briefing.choices[index];
    if (run.phase !== 'briefing' || !choice) return 'No briefing choice is pending.';
    const blocker = choiceBlock(state, choice);
    if (blocker) return blocker;
    run.outcome = applyBriefingChoice(state, choice);
    run.phase = 'outcome';
    run.briefingCommitted = true;
    state.lastEventTitle = run.briefing.title;
    state.lastEventChoiceLabel = choice.action;
    state.lastEventOutcome = run.outcome.join(' ');
    appendLog(state, 'event', `${run.briefing.title} · ${state.lastEventOutcome}`);
    return null;
}

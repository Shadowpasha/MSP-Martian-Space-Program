import type { Area } from '../simulation/tharsis';
import type { SurveyBriefing, SurveyChoice } from '../simulation/tharsisEvents';

export interface EventTemplate {
    system: string;
    titles: readonly string[];
    subjects: readonly string[];
    locations: readonly string[];
    symptoms: readonly string[];
    makeChoices: (subject: string, location: string, variant: number) => SurveyChoice[];
}

function makeChoice(
    action: string,
    detail: string,
    result: string,
    id: SurveyChoice['effects'][number]['id'],
    commitment: SurveyChoice['commitment'] = 'none',
    severity: 1 | 2 = 1,
): SurveyChoice {
    return { action, detail, result, commitment, effects: [{ id, severity }] };
}

function hashStep(seed: number, salt: number): number {
    let x = (seed ^ salt) >>> 0;
    x = Math.imul(x ^ (x >>> 16), 0x45d9f3b) >>> 0;
    x = Math.imul(x ^ (x >>> 16), 0x45d9f3b) >>> 0;
    return (x ^ (x >>> 16)) >>> 0;
}

function pick<T>(items: readonly T[], rng: number, shift: number): T {
    return items[(rng >>> shift) % items.length]!;
}

const LANDING_TEMPLATES: readonly EventTemplate[] = [
    {
        system: 'solar power',
        titles: ['Solar wing latch check', 'Array deployment trim', 'Dust-shroud release'],
        subjects: ['East solar wing', 'West solar wing', 'Auxiliary array', 'Roof panel bank'],
        locations: ['near the hinge pin', 'on the outer truss', 'at the drive motor', 'along the bus bar', 'by the end stop', 'at the gimbal joint'],
        symptoms: ['stopped two degrees short of lock', 'drew higher motor current at dawn', 'caught fine basalt dust on deployment', 'showed uneven voltage across string B', 'logged a brief cold-soak lag'],
        makeChoices: (subject, location, v) => v % 2 === 0 ? [
            makeChoice('Nudge the drive motor', `Pulse power to seat the ${subject.toLowerCase()} cleanly.`, 'The wing latched flush and output climbed.', 'power_saved', 'power'),
            makeChoice('Leave at current angle', 'Accept the slight tilt and save startup power.', 'Output stayed steady without extra draw.', 'none'),
            makeChoice('Run full array sweep', 'Cycle all panels from stop to stop.', 'The full sweep drained extra reserve power.', 'power_loss', 'power'),
        ] : [
            makeChoice('Brush the joint clear', `Clear dust ${location} before locking.`, 'The panel seated cleanly with full sun.', 'power_saved'),
            makeChoice('Bypass the lagging string', 'Switch load to the primary bus only.', 'The primary bus held steady with no fault.', 'crew_confidence'),
            makeChoice('Force the mechanical stop', 'Drive the actuator at peak torque.', 'A tripped breaker cost reserve power.', 'power_loss', 'none', 2),
        ],
    },
    {
        system: 'water reclamation',
        titles: ['Water loop priming', 'Condensate trap purge', 'Recovery tank check'],
        subjects: ['Primary water line', 'Condensate trap', 'Greywater loop', 'Brine separator'],
        locations: ['under the galley deck', 'by the pump manifold', 'in the aft utility bay', 'near the filter housing', 'at the surge tank', 'behind the service panel'],
        symptoms: ['trapped air bubbles after touchdown', 'showed slow flow on the first cycle', 'read slightly high conductivity', 'cooled near freezing during entry', 'triggered a low-head sensor'],
        makeChoices: (subject, location) => [
            makeChoice('Bleed the air pocket', `Vent the valve ${location} at low pressure.`, 'Flow stabilized and reclaimed clean water.', 'water_recovered'),
            makeChoice('Warm the line slowly', `Run trace heat on the ${subject.toLowerCase()}.`, 'Steady heat cleared the line with minor power draw.', 'water_recovered', 'power'),
            makeChoice('Flush the holding tank', 'Dump the first batch and refill.', 'Dumping the batch wasted usable water.', 'water_loss', 'water'),
        ],
    },
    {
        system: 'oxygen generator',
        titles: ['Airlock seal settle', 'O2 scrubber startup', 'Cabin pressure trim'],
        subjects: ['Main airlock seal', 'CO2 scrubber bed', 'O2 regulator', 'Hatch pressure gauge'],
        locations: ['on the outer frame', 'at the rover bay door', 'inside the life support rack', 'along the upper gasket', 'by the bypass valve', 'at the bulkhead feed'],
        symptoms: ['settled slightly after landing shock', 'registered a tiny pressure drift', 'showed dust on the sealing lip', 'cycled slower than orbital baseline', 'buzzed during initial pressurization'],
        makeChoices: (_subject, location) => [
            makeChoice('Wipe and re-seat gasket', `Clean the seal ${location} and latch firmly.`, 'Cabin pressure locked in with zero leak.', 'oxygen_saved'),
            makeChoice('Monitor for one shift', 'Watch the gauge before touching hardware.', 'Pressure held steady across the first check.', 'none'),
            makeChoice('Over-pressurize to test', 'Pump extra oxygen to stress-test the seal.', 'The pressure spike vented reserve oxygen.', 'oxygen_loss', 'none', 2),
        ],
    },
    {
        system: 'rover workshop',
        titles: ['Rover tie-down release', 'Suspension wake-up', 'Chassis bolt check'],
        subjects: ['Rover tie-down clamp', 'Front bogie joint', 'Rear drive hub', 'Charging umbilical'],
        locations: ['in the rover bay', 'on the port wheel well', 'under the chassis frame', 'at the dock cradle', 'near the winch hook', 'by the steering rack'],
        symptoms: ['stayed stiff from entry vibration', 'held shipping tension on one side', 'picked up static dust in transit', 'showed a minor alignment offset', 'needed manual release after landing'],
        makeChoices: (_subject, location) => [
            makeChoice('Release with torque wrench', `Clear the restraint ${location} methodically.`, 'The rover rolled free and ready for prep.', 'crew_confidence'),
            makeChoice('Inspect before powering', 'Check all four hubs before engaging drive.', 'Everything checked out with zero wear.', 'none'),
            makeChoice('Pull free with the winch', 'Use the bay winch without loosening bolts.', 'A sheared pin cost a spare part.', 'materials_loss'),
        ],
    },
    {
        system: 'instrument checkout',
        titles: ['Science rack unbox', 'Sensor mast unlock', 'Telemetry bus check'],
        subjects: ['Science payload rack', 'Weather mast', 'Radiation dosimeter', 'Sample drill housing'],
        locations: ['in the instrument lab', 'at the bulkhead mount', 'inside the padded crate', 'on the calibration bench', 'near the data port', 'at the shock mount'],
        symptoms: ['still carries launch foam locks', 'needs zero-point calibration on Mars', 'shows a loose ribbon connector', 'reads slight gravity shift bias', 'waits for initial power-on test'],
        makeChoices: (subject, location) => [
            makeChoice('Calibrate and stow foam', `Unpack ${location} and run zero-point check.`, `${subject} passed baseline checks cleanly.`, 'crew_confidence'),
            makeChoice('Leave packed until needed', 'Keep shipping locks on until rover prep.', 'Hardware stayed protected for later.', 'none'),
            makeChoice('Cut straps in a hurry', 'Slice tie-downs and power on immediately.', 'A nicked cable needed spare material.', 'materials_loss'),
        ],
    },
    {
        system: 'crew health',
        titles: ['Post-landing checkup', 'Gravity adaptation', 'Dust-lock hygiene'],
        subjects: ['Landing crew', 'Flight medic kit', 'Cabin air filter', 'Sleep quarters'],
        locations: ['after entry G-load', 'in the crew quarters', 'at the medical station', 'near the airlock bench', 'during first unpack', 'in the galley'],
        symptoms: ['feels mild 0.38g balance lag', 'tracked fine regolith dust inside', 'needs hydration logged after descent', 'reports stiff shoulders from harnesses', 'shows elevated heart rate after touchdown'],
        makeChoices: () => [
            makeChoice('Run 20-minute stretch & log', 'Hydrate and ease into Mars gravity.', 'The crew settled in with steady morale.', 'crew_confidence'),
            makeChoice('Push straight into unpacking', 'Skip the break and haul cargo right away.', 'Rushing tired the crew on Sol 1.', 'crew_stress'),
            makeChoice('Use extra water ration', 'Issue bonus water before starting checks.', 'Crew felt great, though water dipped.', 'crew_confidence', 'water'),
        ],
    },
];

const STATION_TEMPLATES: readonly EventTemplate[] = [
    {
        system: 'water reclamation',
        titles: ['Reclaimer filter drift', 'Brine valve stick', 'Condenser frost'],
        subjects: ['Filter cartridge', 'Brine check valve', 'Condenser coil', 'Clean-tank sensor'],
        locations: ['in bay 2', 'on the return line', 'behind the pump rack', 'at the evaporator', 'near the drain port', 'in the wet lab'],
        symptoms: ['showed higher pump pressure this morning', 'frosted lightly overnight', 'logged a 4% flow drop', 'rattled on the morning cycle', 'tripped a turbidity warning'],
        makeChoices: (_subject, location) => [
            makeChoice('Backflush the stage', `Reverse-pulse the line ${location} using power.`, 'Flow normalized and extra water cleared.', 'water_recovered', 'power'),
            makeChoice('Throttle flow for one cycle', 'Run at half speed while watching gauges.', 'Slow flow avoided waste with no cost.', 'none'),
            makeChoice('Dump the suspect batch', 'Vent the tank and restart dry.', 'Venting dumped usable station water.', 'water_loss', 'none', 2),
        ],
    },
    {
        system: 'oxygen generator',
        titles: ['Sabatier valve chatter', 'Scrubber bed saturation', 'O2 manifold hum'],
        subjects: ['Scrubber bed A', 'O2 compressor', 'CO2 intake fan', 'Pressure relief valve'],
        locations: ['in Life Support', 'above the main aisle', 'at the tank header', 'near the thermal loop', 'inside cabinet 3', 'by the vent stack'],
        symptoms: ['drew extra current at shift start', 'warmed above nominal range', 'showed uneven bed saturation', 'whined during pressure top-off', 'flagged a slow valve response'],
        makeChoices: (subject, location) => [
            makeChoice('Swap to backup bed', `Route flow around ${subject.toLowerCase()} ${location}.`, 'O2 output stayed crisp and steady.', 'oxygen_saved'),
            makeChoice('Trim with spare seal', 'Replace the worn O-ring using materials.', 'The fresh seal boosted O2 retention.', 'oxygen_saved', 'materials'),
            makeChoice('Bleed cabin air to reset', 'Vent and re-pressurize the manifold.', 'Purging the line wasted station O2.', 'oxygen_loss'),
        ],
    },
    {
        system: 'solar power',
        titles: ['Array dust buildup', 'Inverter thermal spike', 'Bus voltage sag'],
        subjects: ['North solar string', 'Inverter bank 2', 'Battery shunt', 'Junction box'],
        locations: ['on the east berm', 'near the main breaker', 'at the roof feedthrough', 'by the charge controller', 'along the array trunk', 'at the tie-in'],
        symptoms: ['lost 6% peak output at noon', 'hummed loudly under load', 'registered morning frost drag', 'showed dust static on telemetry', 'dipped during heater startup'],
        makeChoices: (_subject, location) => [
            makeChoice('Rebalance bus loads', `Shift nonessential draw away from ${location}.`, 'Line losses dropped and power recovered.', 'power_saved'),
            makeChoice('Run automated brush pass', 'Cycle the dust-off wipers once.', 'Clean panels returned extra power.', 'power_saved'),
            makeChoice('Ignore the warning', 'Leave the hot inverter at full load.', 'Thermal throttling cost reserve power.', 'power_loss'),
        ],
    },
    {
        system: 'crew health',
        titles: ['Cabin dust irritation', 'Shift fatigue check', 'Airlock chill'],
        subjects: ['Crew air filter', 'Sleep module', 'Medical locker', 'Galley water heater'],
        locations: ['in the hab ring', 'near the airlock', 'by the dining table', 'in the med bay', 'along the corridor', 'at the bunk vents'],
        symptoms: ['stirred fine dust into the air', 'kept the night shift awake', 'ran cooler than usual overnight', 'left crew throats dry at wake-up', 'showed stale CO2 pockets'],
        makeChoices: () => [
            makeChoice('Rotate air fans and rest', 'Boost circulation and ease morning pace.', 'The crew felt sharper for the shift.', 'crew_confidence'),
            makeChoice('Keep standard schedule', 'Note the complaint and continue work.', 'No supplies spent, slight tension lingered.', 'none'),
            makeChoice('Push double-time cleanup', 'Force deep scrub before breakfast.', 'The extra chore wore down morale.', 'crew_stress'),
        ],
    },
    {
        system: 'instrument checkout',
        titles: ['Bench drift alert', 'Calibration lamp fade', 'Logger clock skew'],
        subjects: ['Spectrometer bench', 'Weather logger', 'Sample oven', 'Telemetry relay'],
        locations: ['in the Instrument Lab', 'on rack 2', 'at the test jig', 'near the antenna feed', 'by the power strip', 'at the cold plate'],
        symptoms: ['drifted 0.4% since yesterday', 'flickered during self-test', 'lost sync with station clock', 'picked up RF noise from heaters', 'showed condensation on the lens'],
        makeChoices: (_subject, location) => [
            makeChoice('Run quick zero-cal', `Re-zero the sensor ${location} offline.`, 'Clean calibration saved bench power.', 'power_saved'),
            makeChoice('Log the offset', 'Apply software correction later.', 'No delay and no power wasted.', 'none'),
            makeChoice('Leave full rack powered', 'Keep heaters and lamps on all morning.', 'Idle draw wasted reserve power.', 'power_loss'),
        ],
    },
    {
        system: 'rover workshop',
        titles: ['Dock charger hum', 'Wheel dust pack', 'Suit port seal'],
        subjects: ['Docking umbilical', 'Rover wheel hub', 'Suit port latch', 'Tool bay compressor'],
        locations: ['in Rover Bay', 'under the gantry', 'at the left bogie', 'by the air hose', 'near the ramp', 'at the battery cradle'],
        symptoms: ['caked fine dust in the treads', 'clicked twice on charger lock', 'leaked a trace of shop air', 'showed warm bearing telemetry', 'needed torque verification'],
        makeChoices: (_subject, location) => [
            makeChoice('Brush and lube the joint', `Service the assembly ${location} now.`, 'Smooth rolling cut dock power draw.', 'power_saved'),
            makeChoice('Schedule in normal prep', 'Leave it for the next bay work order.', 'No upfront cost and safe to hold.', 'none'),
            makeChoice('Over-torque the clamp', 'Crank the latch tight without cleaning.', 'Grinding dust wore down spare parts.', 'materials_loss'),
        ],
    },
    {
        system: 'food storage',
        titles: ['Hydroponic tray pH', 'Pantry seal frost', 'Nutrient pump hum'],
        subjects: ['Upper grow tray', 'Pantry locker B', 'Nutrient mixer', 'LED light bar'],
        locations: ['in Life Support', 'near the aft bulkhead', 'by the cold locker', 'under tray 3', 'at the drip manifold', 'on the galley wall'],
        symptoms: ['shifted slightly alkaline', 'formed frost near the door seal', 'gurgled on the morning feed', 'warmed the nearby ration bin', 'dripped onto the catch pan'],
        makeChoices: () => [
            makeChoice('Top up nutrient buffer', 'Balance the tray with a splash of water.', 'Healthy greens boosted crew morale.', 'crew_confidence', 'water'),
            makeChoice('Wipe frost and inspect', 'Clear the seal without opening rations.', 'Everything stayed dry and intact.', 'none'),
            makeChoice('Leave warm bin sealed', 'Ignore the temperature alert until tomorrow.', 'Spoiled packets trimmed food stock.', 'food_loss'),
        ],
    },
];

const ROVER_TEMPLATES: readonly EventTemplate[] = [
    {
        system: 'rover power',
        titles: ['Drivetrain amp spike', 'Battery cell chill', 'Regen brake fault'],
        subjects: ['Port drive motor', 'Battery pack B', 'Solar deck', 'Heater bus'],
        locations: ['climbing a loose ridge', 'crossing wind-packed ripples', 'at the cold morning wake-up', 'along the crater rim', 'descending a dusty slope', 'near the waypoint marker'],
        symptoms: ['pulled 12% extra current', 'dropped two degrees below target', 'collected static dust on the deck', 'flagged an uneven cell voltage', 'stalled briefly on soft regolith'],
        makeChoices: (_subject, location) => [
            makeChoice('Drop to low-gear crawl', `Ease speed ${location} to protect cells.`, 'Smooth driving preserved rover power.', 'power_saved'),
            makeChoice('Hold steady cruise', 'Keep current pace and watch temp.', 'Power held steady across the leg.', 'none'),
            makeChoice('Power through at full torque', 'Max out motors to clear the ridge fast.', 'High current drained rover batteries.', 'power_loss', 'none', 2),
        ],
    },
    {
        system: 'rover oxygen',
        titles: ['Cabin scrubber whine', 'Suit loop pressure', 'O2 tank valve'],
        subjects: ['Rover scrubber', 'Airlock hatch', 'Cabin O2 regulator', 'Suit umbilical'],
        locations: ['inside the forward cab', 'at the side hatch', 'behind the seats', 'along the suit line', 'near the console', 'at the tank rack'],
        symptoms: ['cycled louder than usual', 'showed a 2% pressure dip', 'frosted at the regulator body', 'buzzed after suit disconnect', 'smelled faintly of ozone'],
        makeChoices: (_subject, location) => [
            makeChoice('Cycle the backup regulator', `Switch valves ${location} and check seal.`, 'Cabin O2 stabilized cleanly.', 'oxygen_saved'),
            makeChoice('Watch cabin gauge', 'Log the reading without touching valves.', 'Pressure stayed within safe limits.', 'none'),
            makeChoice('Purge cabin atmosphere', 'Vent and refill cabin air.', 'Venting wasted precious rover O2.', 'oxygen_loss', 'none', 2),
        ],
    },
    {
        system: 'route communications',
        titles: ['Relay dish fade', 'High-gain lock loss', 'Telemetry packet drop'],
        subjects: ['High-gain dish', 'UHF whip antenna', 'Station relay link', 'Nav transponder'],
        locations: ['behind a basalt outcrop', 'in a shallow wash', 'along the ridge shadow', 'at the turnoff point', 'under high dust haze', 'near the crater wall'],
        symptoms: ['dropped two telemetry frames', 'lost directional lock briefly', 'picked up terrain multipath', 'lagged on station ping', 'needed manual azimuth trim'],
        makeChoices: (_subject, location) => [
            makeChoice('Pause and re-aim dish', `Stop briefly ${location} to lock signal.`, 'Crisp link saved transmitter power.', 'power_saved'),
            makeChoice('Switch to low-rate beacon', 'Send compressed status only.', 'Link stayed intact with zero loss.', 'none'),
            makeChoice('Boost transmitter to max', 'Blast full power through the shadow.', 'Max TX drained rover battery.', 'power_loss'),
        ],
    },
    {
        system: 'field instrument',
        titles: ['Sensor head dust', 'Sample arm bind', 'Logger buffer alert'],
        subjects: ['Field instrument head', 'Deployment arm', 'Data logger', 'Core sleeve'],
        locations: ['at the tripod mount', 'near the wheel wake', 'on the rocky apron', 'by the sample tray', 'under windblown grit', 'at the cable reel'],
        symptoms: ['caught windblown dust on the lens', 'hesitated on cold grease', 'flagged a buffer sync warning', 'shifted slightly on loose gravel', 'needed a clean baseline'],
        makeChoices: (_subject, location, v) => v % 3 === 0 ? [
            makeChoice('Brush and re-level mount', `Clean the head ${location} while logging.`, 'Clean readings kept sampling on track.', 'none'),
            makeChoice('Power heater collar', 'Warm the joint using rover power.', 'Warm grease freed the arm smoothly.', 'power_saved', 'power'),
            makeChoice('Hard-reset the logger', 'Cut power and reboot the unit.', 'Rebooting lost the Sol’s sampling.', 'field_reset'),
        ] : [
            makeChoice('Verify connector seating', `Check the cable ${location} gently.`, 'Signal stayed sharp with zero loss.', 'crew_confidence'),
            makeChoice('Keep logging as-is', 'Note the minor jitter in field notes.', 'Data remained valid and usable.', 'none'),
            makeChoice('Force the arm past bind', 'Drive the actuator without clearing grit.', 'Strain drained power and stressed crew.', 'power_loss'),
        ],
    },
    {
        system: 'field supplies',
        titles: ['Ration box rattle', 'Water bladder chill', 'Med pack shift'],
        subjects: ['Ration crate', 'Water bladder', 'Spare kit strap', 'Emergency pouch'],
        locations: ['on the rear rack', 'under the bench', 'by the door pocket', 'in the cargo net', 'next to the heater', 'at the bulkhead'],
        symptoms: ['worked loose on rocky ground', 'sloshed near the cold wall', 'blocked the aisle latch', 'rubbed against the frame', 'needed re-strapping at halt'],
        makeChoices: () => [
            makeChoice('Re-lash cargo net', 'Tighten straps at the next brief stop.', 'Load stayed secure and morale rose.', 'crew_confidence'),
            makeChoice('Leave until camp halt', 'Wait for the end-of-drive stop.', 'Nothing broke along the trail.', 'none'),
            makeChoice('Ignore rattling crate', 'Keep driving fast over boulders.', 'A cracked container spilled water.', 'water_loss'),
        ],
    },
    {
        system: 'field dosimetry',
        titles: ['Dosimeter spike', 'Solar wind gust', 'Terrain shadow check'],
        subjects: ['Cab dosimeter', 'EVA badge', 'Hull sensor', 'Particle counter'],
        locations: ['crossing open flat', 'near the ridge crest', 'at the rim overlook', 'along the exposed bench', 'in thin midday haze', 'outside the cab'],
        symptoms: ['ticked up 15% above baseline', 'logged a brief proton gust', 'warned of low terrain shielding', 'peaked during midday transit', 'showed higher outside counts'],
        makeChoices: () => [
            makeChoice('Hug the ridge shadow', 'Route along the rock wall for cover.', 'Natural rock cut crew exposure.', 'crew_confidence'),
            makeChoice('Stay inside cab', 'Skip extra outside checks today.', 'Cab hull kept exposure nominal.', 'none'),
            makeChoice('Extend outside EVA', 'Linger in the open to double-check.', 'Extra outside time raised radiation.', 'exposure'),
        ],
    },
];

export const EVENT_LIBRARY_COUNTS = {
    landingProcedural: LANDING_TEMPLATES.reduce((sum, t) => sum + t.titles.length * t.subjects.length * t.locations.length * t.symptoms.length, 0),
    stationProcedural: STATION_TEMPLATES.reduce((sum, t) => sum + t.titles.length * t.subjects.length * t.locations.length * t.symptoms.length, 0),
    roverProcedural: ROVER_TEMPLATES.reduce((sum, t) => sum + t.titles.length * t.subjects.length * t.locations.length * t.symptoms.length, 0),
};

function buildFromTemplate(template: EventTemplate, rng: number, area: Area, source: SurveyBriefing['source'], atSurveySite: boolean): SurveyBriefing {
    const title = pick(template.titles, rng, 0);
    const subject = pick(template.subjects, rng, 4);
    const location = pick(template.locations, rng, 8);
    const symptom = pick(template.symptoms, rng, 12);
    const variant = (rng >>> 16) & 0xff;
    let choices = template.makeChoices(subject, location, variant);
    if (!atSurveySite) {
        choices = choices.map(c => c.effects.some(e => e.id === 'field_reset')
            ? makeChoice(c.action, c.detail, 'The reset drained reserve power without helping.', 'power_loss', c.commitment)
            : c);
    }
    const rot = variant % choices.length;
    return {
        title,
        system: template.system,
        area,
        source,
        observation: `${subject} ${location} ${symptom}.`,
        choices: [...choices.slice(rot), ...choices.slice(0, rot)],
    };
}

export function proceduralLandingEvent(seed: number): SurveyBriefing {
    const rng = hashStep(seed, 0x9e3779b9);
    const template = LANDING_TEMPLATES[rng % LANDING_TEMPLATES.length]!;
    return buildFromTemplate(template, hashStep(rng, 0x7f4a7c15), 'station', 'Mission control', false);
}

export function proceduralDailyEvent(seed: number, sol: number, area: Area, recentSystems: readonly string[], atSurveySite: boolean): SurveyBriefing {
    const base = hashStep(seed, sol * 0x85ebca6b + (area === 'rover' ? 0xc2b2ae35 : 0x27d4eb2f));
    const pool = area === 'station' ? STATION_TEMPLATES : ROVER_TEMPLATES;
    const filtered = pool.filter(t => !recentSystems.slice(-2).includes(t.system));
    const candidates = filtered.length ? filtered : pool;
    const template = candidates[base % candidates.length]!;
    return buildFromTemplate(template, hashStep(base, 0x165667b1), area, 'Local', atSurveySite);
}

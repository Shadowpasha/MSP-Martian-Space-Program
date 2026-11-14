import type {
    CargoInventory,
    CrewRole,
    ResourcePool,
    WeatherType,
} from '../contracts/gameContract';

export type MissionProgressDelta = Partial<Record<'prep_sensor' | 'prep_rover' | 'prep_supplies', number>>;

export interface EventChoice {
    id: string;
    label: string;
    summary: string;
    requiresCargo?: keyof CargoInventory;
    requiresRole?: CrewRole;
    consumesCargo?: Partial<CargoInventory>;
    resourceDelta?: Partial<ResourcePool>;
    radiationDelta?: number;
    moraleDelta?: number;
    requirementDelta?: MissionProgressDelta;
    outcomeText: string;
}

export interface DailyEventDef {
    id: string;
    title: string;
    prompt: string;
    badge: string;
    scienceFact: string;
    source?: 'static' | 'gemini';
    minSol?: number;
    maxSol?: number;
    preferredWeather?: WeatherType;
    choices: EventChoice[];
}

export const DAILY_EVENTS: DailyEventDef[] = [
    {
        id: 'sol1_landing_check',
        title: 'Landing Checkup!',
        prompt: 'Dust settled on our solar wings and an O2 valve needs tuning. What should we do first?',
        badge: 'DAY 1 CHECK',
        scienceFact: 'Real NASA Fact: Landing blasts red Mars dust onto solar arrays, so missions like NASA InSight check power tilt on day one!',
        minSol: 1,
        maxSol: 1,
        choices: [
            {
                id: 'calibrate_with_eng',
                label: 'Engineer Tune-Up [Kalpana Perk]',
                summary: '+6 Power, +3 O2, +4 Morale (Free!)',
                requiresRole: 'engineer',
                resourceDelta: { energy: 6, oxygen: 3 },
                moraleDelta: 4,
                outcomeText: 'Kalpana tuned the solar trackers and O2 valves in minutes!',
            },
            {
                id: 'spend_battery_boost',
                label: 'Use Spare Battery Pack [-1 Battery]',
                summary: '+18 Power, +2 Morale',
                requiresCargo: 'batteryPacks',
                consumesCargo: { batteryPacks: 1 },
                resourceDelta: { energy: 18 },
                moraleDelta: 2,
                outcomeText: 'Battery pack plugged in! Station power zoomed to full.',
            },
            {
                id: 'sweep_sensor_mast',
                label: 'Quick Solar Brush',
                summary: '+7 Power, +3 Res, +2 Morale',
                resourceDelta: { energy: 7, res: 3 },
                moraleDelta: 2,
                outcomeText: 'Crew brushed off the landing dust cleanly!',
            },
        ],
    },
    {
        id: 'solar_dust_buildup',
        title: 'Dusty Solar Panels!',
        prompt: 'Red Mars dust is blocking sunlight! Our solar charging dropped 35%.',
        badge: 'POWER ALERT',
        scienceFact: 'Real NASA Fact: Fine Martian dust clings with static electricity and ended NASA Opportunity rover missions when sunlight vanished.',
        minSol: 2,
        choices: [
            {
                id: 'use_battery_pack',
                label: 'Swap Battery Pack [-1 Battery]',
                summary: '+20 Power right away',
                requiresCargo: 'batteryPacks',
                consumesCargo: { batteryPacks: 1 },
                resourceDelta: { energy: 20 },
                outcomeText: 'Backup battery kept every light shining bright!',
            },
            {
                id: 'manual_panel_wipe',
                label: 'Wash Panels Outside (-4 Water, -2 O2)',
                summary: '+16 Power, +2 Morale',
                resourceDelta: { energy: 16, water: -4, oxygen: -2 },
                moraleDelta: 2,
                outcomeText: 'Crew wiped the solar panels squeaky clean!',
            },
            {
                id: 'power_save_mode',
                label: 'Dim Lights & Save Power',
                summary: '-4 Power, -7 Morale (chilly cabin)',
                resourceDelta: { energy: -4 },
                moraleDelta: -7,
                outcomeText: 'Crew bundled up in warm jackets for the evening.',
            },
        ],
    },
    {
        id: 'hydroponics_blight',
        title: 'Cloudy Plant Tanks!',
        prompt: 'Green algae clouded the plant water. If we wait, our veggies will spoil!',
        badge: 'PLANTS',
        scienceFact: 'Real NASA Fact: NASA grows space lettuce and radishes hydroponically (in water, without dirt) to recycle air and feed astronauts.',
        minSol: 2,
        choices: [
            {
                id: 'reseed_pod',
                label: 'Plant Fresh Seeds [-1 Seed Pod, -4 Water]',
                summary: '+10 Food, +5 O2, +4 Morale',
                requiresCargo: 'seedPods',
                consumesCargo: { seedPods: 1 },
                resourceDelta: { water: -4, food: 10, oxygen: 5 },
                moraleDelta: 4,
                outcomeText: 'Crispy kale and baby carrots sprouted fast!',
            },
            {
                id: 'botanist_rescue',
                label: 'Scott Bio-Filter [Botanist Perk]',
                summary: '+6 Food, +4 O2, +3 Morale (-2 Water)',
                requiresRole: 'botanist',
                resourceDelta: { water: -2, food: 6, oxygen: 4 },
                moraleDelta: 3,
                outcomeText: 'Scott saved the whole greenhouse without wasting seeds!',
            },
            {
                id: 'dump_trays',
                label: 'Clear Bad Trays',
                summary: '-5 Food, -3 O2, -4 Morale',
                resourceDelta: { food: -5, oxygen: -3 },
                moraleDelta: -4,
                outcomeText: 'Bad trays tossed out. Smaller salads tonight.',
            },
        ],
    },
    {
        id: 'sandstorm_wind_window',
        title: 'Giant Sandstorm Incoming!',
        prompt: 'A swirling dust storm is heading our way! Best time to prep our Weather Mission.',
        badge: 'BIG STORM',
        scienceFact: 'Real NASA Fact: Mars sandstorms can wrap the whole planet for weeks! Measuring wind speeds helps NASA land future ships safely.',
        minSol: 10,
        maxSol: 15,
        choices: [
            {
                id: 'prep_wind_sampler',
                label: 'Spin Up Wind Sampler',
                summary: '+1 Prep Sensor, +5 Res, +6 Morale (-3 Power)',
                requiresCargo: 'windSampler',
                resourceDelta: { res: 5, energy: -3 },
                moraleDelta: 6,
                requirementDelta: { prep_sensor: 1 },
                outcomeText: 'Wind Sampler ready (+1 Prep Sensor)! Open Issue Tasks to collect data.',
            },
            {
                id: 'batten_hatches',
                label: 'Lock Storm Shutters',
                summary: '+5 Morale, -5 Power (safe & cozy)',
                resourceDelta: { energy: -5 },
                moraleDelta: 5,
                outcomeText: 'Shutters locked tight! Open Issue Tasks when ready to sample.',
            },
        ],
    },
    {
        id: 'micrometeorite_leak',
        title: 'Tiny Hull Pinhole!',
        prompt: 'Beep-beep! A tiny space pebble poked a hole in Airlock B and air is leaking.',
        badge: 'AIR LEAK',
        scienceFact: 'Real NASA Fact: Micrometeoroids smaller than a grain of sand travel faster than bullets, so space habitats track cabin pressure nonstop.',
        minSol: 3,
        choices: [
            {
                id: 'use_repair_kit',
                label: 'Patch with Repair Kit [-1 Repair Kit]',
                summary: 'Quick seal! -2 O2, +3 Morale',
                requiresCargo: 'repairKits',
                consumesCargo: { repairKits: 1 },
                resourceDelta: { oxygen: -2 },
                moraleDelta: 3,
                outcomeText: 'Space patch sealed the leak in seconds!',
            },
            {
                id: 'weld_scrap_patch',
                label: 'Weld Scrap Metal',
                summary: '-7 O2, -4 Res, -4 Power, -2 Morale',
                resourceDelta: { oxygen: -7, res: -4, energy: -4 },
                moraleDelta: -2,
                outcomeText: 'Metal patch welded over the hole. Pressure stable!',
            },
            {
                id: 'bulkhead_seal',
                label: 'Close Sector B Door',
                summary: '-6 O2, -8 Morale (crowded)',
                resourceDelta: { oxygen: -6 },
                moraleDelta: -8,
                outcomeText: 'Sector B closed off. Everyone squeezed into the main room.',
            },
        ],
    },
    {
        id: 'solar_proton_flare',
        title: 'Solar Flare Alert!',
        prompt: 'A bright burst from the sun is sending extra radiation toward Mars!',
        badge: 'SUN FLARE',
        scienceFact: 'Real NASA Fact: Mars has no strong magnetic shield like Earth, so NASA astronauts can hide behind water tanks during solar flares!',
        minSol: 4,
        choices: [
            {
                id: 'administer_medkits',
                label: 'Use Rad Medicine [-1 Medkit]',
                summary: '-6 Radiation, +4 Morale',
                requiresCargo: 'medkits',
                consumesCargo: { medkits: 1 },
                radiationDelta: -6,
                moraleDelta: 4,
                outcomeText: 'Medkits protected the crew from the sun flare!',
            },
            {
                id: 'medic_triage',
                label: 'Medic Water-Wall Shelter [Bernard Perk]',
                summary: '+4 Radiation only, +3 Morale',
                requiresRole: 'medic',
                radiationDelta: 4,
                moraleDelta: 3,
                outcomeText: 'Bernard guided everyone safely behind the water tanks!',
            },
            {
                id: 'ride_it_out',
                label: 'Keep Working',
                summary: '+16 Radiation, -6 Morale',
                radiationDelta: 16,
                moraleDelta: -6,
                outcomeText: 'Radiation spiked outside while work kept going.',
            },
        ],
    },
    {
        id: 'rover_signal_intercept',
        title: 'Mystery Probe Ping!',
        prompt: 'Our radio dish heard a friendly beep from an old 2022 Mars probe nearby.',
        badge: 'DISCOVERY',
        scienceFact: 'Real NASA Fact: Orbiters circling Mars act like space cell towers, beaming rover photos and science telemetry back to Earth.',
        minSol: 3,
        choices: [
            {
                id: 'ping_highgain_boost',
                label: 'Full Dish Scan (-5 Power)',
                summary: '+9 Res, +4 Morale',
                resourceDelta: { energy: -5, res: 9 },
                moraleDelta: 4,
                outcomeText: 'Downloaded awesome probe maps and spare blueprints!',
            },
            {
                id: 'download_telemetry',
                label: 'Quick Ping (-3 Power)',
                summary: '+5 Res',
                resourceDelta: { energy: -3, res: 5 },
                outcomeText: 'Grabbed useful probe data safely from base.',
            },
            {
                id: 'ignore_beacon',
                label: 'Skip It & Save Power',
                summary: '-1 Morale',
                moraleDelta: -1,
                outcomeText: 'The probe signal faded away by sunset.',
            },
        ],
    },
    {
        id: 'water_recycler_clog',
        title: 'Clogged Water Pipe!',
        prompt: 'Salty Mars minerals slowed down our clean water recycler.',
        badge: 'WATER PIPE',
        scienceFact: 'Real NASA Fact: Space crews recycle over 98% of their water, turning humidity from breath and sweat back into clean drinking water!',
        minSol: 2,
        choices: [
            {
                id: 'repair_condenser',
                label: 'Swap Filter [-1 Repair Kit]',
                summary: '+8 Water right away',
                requiresCargo: 'repairKits',
                consumesCargo: { repairKits: 1 },
                resourceDelta: { water: 8 },
                outcomeText: 'Fresh filter installed! Cool, clean water is flowing.',
            },
            {
                id: 'boil_flush',
                label: 'Hot Steam Flush (-6 Power)',
                summary: '+6 Water',
                resourceDelta: { energy: -6, water: 6 },
                outcomeText: 'Steam blast cleared the pipe nicely!',
            },
            {
                id: 'ration_wash',
                label: 'Save Power for Now',
                summary: '-4 Water, -6 Morale',
                resourceDelta: { water: -4 },
                moraleDelta: -6,
                outcomeText: 'Short sink washes for the next couple days.',
            },
        ],
    },
    {
        id: 'cabin_fever_morale',
        title: 'Movie & Snack Night?',
        prompt: 'Living on Mars is tough! The crew wants a fun movie night with snacks.',
        badge: 'CREW FUN',
        scienceFact: 'Real NASA Fact: NASA tests crew teamwork inside pretend Mars domes in Hawaii and Texas because staying cheerful boosts problem-solving!',
        minSol: 4,
        choices: [
            {
                id: 'open_extra_rations',
                label: 'Open Snack Crate [-1 Extra Rations]',
                summary: '+14 Morale, +4 Food, -3 Power',
                requiresCargo: 'extraRations',
                consumesCargo: { extraRations: 1 },
                resourceDelta: { food: 4, energy: -3 },
                moraleDelta: 14,
                outcomeText: 'Freeze-dried strawberries and a space comedy cheered everyone up!',
            },
            {
                id: 'counseling_session',
                label: 'Music & Stories [Bernard Perk]',
                summary: '+9 Morale, -2 Power',
                requiresRole: 'medic',
                resourceDelta: { energy: -2 },
                moraleDelta: 9,
                outcomeText: 'Bernard hosted game night and everyone laughed!',
            },
            {
                id: 'deny_break',
                label: 'Back to Work',
                summary: '-8 Morale',
                moraleDelta: -8,
                outcomeText: 'Quiet dinner tonight before bedtime.',
            },
        ],
    },
    {
        id: 'subsurface_ice_pocket',
        title: 'Ice Found Nearby!',
        prompt: 'Our ground scanner found sparkling frozen water just 250m from base!',
        badge: 'BONUS ICE',
        scienceFact: 'Real NASA Fact: Huge sheets of frozen water sit just under Mars red dirt! Future astronauts can melt it to drink and make rocket fuel.',
        minSol: 3,
        choices: [
            {
                id: 'thermal_pump_tap',
                label: 'Melt & Pump Ice (-6 Power)',
                summary: '+12 Water, +1 Prep Supplies, +3 Morale',
                resourceDelta: { energy: -6, water: 12 },
                moraleDelta: 3,
                requirementDelta: { prep_supplies: 1 },
                outcomeText: 'Melted fresh ice straight into our main water tank!',
            },
            {
                id: 'surface_scrape',
                label: 'Scoop Quick Bucket (-2 Power)',
                summary: '+5 Water',
                resourceDelta: { energy: -2, water: 5 },
                outcomeText: 'Filled a handy reserve jug with frost.',
            },
        ],
    },
    {
        id: 'sandstorm_sensor_damage',
        title: 'Sandstorm Hit Sensor Mast!',
        prompt: 'High-speed Mars grit slammed our weather mast! If unbraced, the storm will knock it offline.',
        badge: 'STORM HIT',
        scienceFact: 'Real NASA Fact: Martian dust storms whip winds up to 100 km/h and pack grit into outdoor weather booms like Mars Perseverance sensors!',
        preferredWeather: 'Dust Storm',
        minSol: 4,
        choices: [
            {
                id: 'engineer_brace_mast',
                label: 'Bolt & Brace Mast [Kalpana Perk]',
                summary: 'Protects Sensor, +1 Prep Sensor, +2 Morale',
                requiresRole: 'engineer',
                moraleDelta: 2,
                requirementDelta: { prep_sensor: 1 },
                outcomeText: 'Kalpana locked the mast bolts tight so the storm could not break the sensor!',
            },
            {
                id: 'patch_mast_kit',
                label: 'Armor With Repair Kit [-1 Repair Kit]',
                summary: 'Protects Sensor, +1 Prep Sensor, +3 Res',
                requiresCargo: 'repairKits',
                consumesCargo: { repairKits: 1 },
                resourceDelta: { res: 3 },
                requirementDelta: { prep_sensor: 1 },
                outcomeText: 'Titanium brackets shielded the weather mast through the dust gust!',
            },
            {
                id: 'shelter_ignore_mast',
                label: 'Stay Inside Safe (-2 Morale)',
                summary: '-1 Prep Sensor if ready (needs re-prep)',
                moraleDelta: -2,
                requirementDelta: { prep_sensor: -1 },
                outcomeText: 'Wild Mars grit jammed the outside weather sensor! Re-prep it when clear.',
            },
        ],
    },
    {
        id: 'dust_jammed_rover',
        title: 'Dust Jammed Rover Wheel!',
        prompt: 'Red regolith packed tight around our rover drive axle before the big expedition.',
        badge: 'ROVER ALERT',
        scienceFact: 'Real NASA Fact: Mars rovers wiggle and reverse-steer their aluminum wheels to shake off sticky sand and protect their motors!',
        preferredWeather: 'Dust Haze',
        minSol: 4,
        choices: [
            {
                id: 'pilot_wiggle_clean',
                label: 'Pilot Rock-Crawl Free [Eileen Perk]',
                summary: '+1 Prep Rover, -2 Power, +3 Morale',
                requiresRole: 'pilot',
                resourceDelta: { energy: -2 },
                moraleDelta: 3,
                requirementDelta: { prep_rover: 1 },
                outcomeText: 'Eileen wiggled the wheels out smoothly and calibrated rover steering!',
            },
            {
                id: 'replace_rover_seal',
                label: 'Swap Axle Seal [-1 Repair Kit]',
                summary: '+1 Prep Rover, +2 Morale',
                requiresCargo: 'repairKits',
                consumesCargo: { repairKits: 1 },
                moraleDelta: 2,
                requirementDelta: { prep_rover: 1 },
                outcomeText: 'Fresh dust seal clicked right into place. Rover rolls like new!',
            },
            {
                id: 'park_rover_for_later',
                label: 'Leave Rover Parked for Now',
                summary: '-1 Prep Rover if prepped, -3 Morale',
                moraleDelta: -3,
                requirementDelta: { prep_rover: -1 },
                outcomeText: 'Fine dust stiffened the wheel hub, knocking Rover Prep back down.',
            },
        ],
    },
];

export function isScriptedStoryEvent(
    sol: number,
    goalCompleted: boolean,
    usedEventIds: ReadonlySet<string>,
): boolean {
    if (sol === 1) return true;
    return !goalCompleted && sol >= 11 && sol <= 15 && !usedEventIds.has('sandstorm_wind_window');
}

export function pickDailyEvent(
    sol: number,
    weather: WeatherType,
    usedEventIds: ReadonlySet<string>,
    goalCompleted: boolean,
): DailyEventDef {
    if (sol === 1) {
        return DAILY_EVENTS[0]!;
    }
    // Guarantee Sandstorm Wind Sample trigger window around Sol 11-15 if not yet done
    if (!goalCompleted && sol >= 11 && sol <= 15 && !usedEventIds.has('sandstorm_wind_window')) {
        return DAILY_EVENTS.find((e) => e.id === 'sandstorm_wind_window')!;
    }
    const pool = DAILY_EVENTS.filter((e) => {
        if (e.id === 'sol1_landing_check') return false;
        if (e.minSol && sol < e.minSol) return false;
        if (e.maxSol && sol > e.maxSol) return false;
        if (e.id === 'sandstorm_wind_window' && goalCompleted) return false;
        return !usedEventIds.has(e.id);
    });
    const candidates = pool.length > 0
        ? pool
        : DAILY_EVENTS.filter((e) => e.id !== 'sol1_landing_check' && (e.id !== 'sandstorm_wind_window' || !goalCompleted));

    const weatherHit = candidates.find((e) => e.preferredWeather === weather);
    if (weatherHit) return weatherHit;

    // Deterministic rotation mixed with sol index so runs feel varied yet predictable
    const idx = (sol * 7 + weather.length * 3) % candidates.length;
    return candidates[idx]!;
}

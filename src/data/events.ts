import type {
    CargoInventory,
    CrewRole,
    ResourcePool,
    WeatherType,
} from '../contracts/gameContract';

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
    outcomeText: string;
}

export interface DailyEventDef {
    id: string;
    title: string;
    prompt: string;
    badge: string;
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
        minSol: 1,
        maxSol: 1,
        choices: [
            {
                id: 'calibrate_with_eng',
                label: 'Engineer Tune-Up [Elena Perk]',
                summary: '+6 Power, +3 O2, +4 Morale (Free!)',
                requiresRole: 'engineer',
                resourceDelta: { energy: 6, oxygen: 3 },
                moraleDelta: 4,
                outcomeText: 'Elena tuned the solar trackers and O2 valves in minutes!',
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
                label: 'Kenji Bio-Filter [Botanist Perk]',
                summary: '+6 Food, +4 O2, +3 Morale (-2 Water)',
                requiresRole: 'botanist',
                resourceDelta: { water: -2, food: 6, oxygen: 4 },
                moraleDelta: 3,
                outcomeText: 'Kenji saved the whole greenhouse without wasting seeds!',
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
        minSol: 10,
        maxSol: 15,
        choices: [
            {
                id: 'prep_wind_sampler',
                label: 'Spin Up Wind Sampler [-1 Wind Sampler]',
                summary: '+5 Res, +6 Morale (-3 Power)',
                requiresCargo: 'windSampler',
                consumesCargo: { windSampler: 1 },
                resourceDelta: { res: 5, energy: -3 },
                moraleDelta: 6,
                outcomeText: 'Wind Sampler ready! Open Issue Tasks to collect data.',
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
                label: 'Medic Water-Wall Shelter [Marcus Perk]',
                summary: '+4 Radiation only, +3 Morale',
                requiresRole: 'medic',
                radiationDelta: 4,
                moraleDelta: 3,
                outcomeText: 'Marcus guided everyone safely behind the water tanks!',
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
                label: 'Music & Stories [Marcus Perk]',
                summary: '+9 Morale, -2 Power',
                requiresRole: 'medic',
                resourceDelta: { energy: -2 },
                moraleDelta: 9,
                outcomeText: 'Marcus hosted game night and everyone laughed!',
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
        minSol: 3,
        choices: [
            {
                id: 'thermal_pump_tap',
                label: 'Melt & Pump Ice (-6 Power)',
                summary: '+12 Water, +3 Morale',
                resourceDelta: { energy: -6, water: 12 },
                moraleDelta: 3,
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
];

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

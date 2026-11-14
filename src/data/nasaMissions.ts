// NASA-based missions for the mission picker. Each one copies a job a real NASA
// mission or instrument did, shows the player that fact with its source in the
// briefing popup, and becomes a full MissionSetupInput in the same format as the
// Tharsis survey (deadline, prep requirements, minimum reserves, required cargo).
//
// Coordinates are approximate (Jezero Crater ≈ 18.4°N 77.5°E; lunar south pole).
// Distances are game values (movement points), not real kilometres.
import {
    cloneSetup, DEFAULT_MARS_SETUP, MOON_TEST_SETUP,
    type CargoItemId, type GoalFlag, type MissionSetupInput, type PlanetId,
} from '../contracts/gameContract';

export interface NasaSource {
    label: string;
    url: string;
}

interface NasaSite {
    name: string;
    coords: string;
    /** Distance from the base in movement points. */
    distanceMP: number;
}

export interface NasaMission {
    id: string;
    title: string;
    planet: PlanetId;
    /** What the crew will do, in plain words (popup). */
    briefing: string;
    /** Short goal line used in the card description, e.g. "Drill an ice core for 1 sol". */
    objective: string;
    realBasis: { mission: string; fact: string; sources: NasaSource[] };
    /** Short NASA name for the popup heading ("Real NASA mission: …"). */
    cardBasis: string;
    /** The trade-off this mission teaches (popup "Why it matters"). */
    lesson: string;
    site: NasaSite;
    /** Sols of work at the site. */
    taskSols: number;
    /** Spare sols added to the deadline. */
    spareSols: number;
    durationHours: number;
    /** Label of the prep_sensor requirement, e.g. "Prep Oxygen Maker". */
    sensorLabel: string;
    goalFlag: GoalFlag;
    /** Cargo that Cargo Preparation must contain before launch. */
    requiredEquipment: Partial<Record<CargoItemId, number>>;
    /** Card and popup picture. */
    image: string;
}

/** Rover speed used to turn site distance into travel sols. */
const ROVER_MP_PER_SOL = 5;
/** Same reserve rule as the Tharsis survey, so every mission plays by one standard. */
const MINIMUM_RESERVES = { food: 10, water: 10, oxygen: 25 } as const;

const SRC = {
    perseverance: { label: 'NASA Science: Perseverance instruments', url: 'https://science.nasa.gov/mission/mars-2020-perseverance/science-instruments/' },
    donki: { label: 'NASA DONKI space weather database (solar storms)', url: 'https://kauai.ccmc.gsfc.nasa.gov/DONKI/' },
    phoenixIce: { label: 'NASA Astrobiology: Phoenix lander found ice (2008)', url: 'https://astrobiology.nasa.gov/news/bright-chunks-at-phoenix-landers-mars-site-must-have-been-ice/' },
    lcross: { label: 'NASA Science: LCROSS mission', url: 'https://science.nasa.gov/mission/lcross/' },
    moxie: { label: 'NASA JPL: MOXIE completes Mars mission (2023)', url: 'https://www.jpl.nasa.gov/news/nasas-oxygen-generating-experiment-moxie-completes-mars-mission/' },
    rad: { label: 'SwRI: First radiation measurements from the surface of Mars', url: 'https://www.swri.org/press-release/swri-scientists-publish-first-radiation-measurements-surface-mars' },
    veggie: { label: 'Phys.org: First bite of space-grown lettuce (NASA Veggie, 2015)', url: 'https://phys.org/news/2015-08-space-grown-lettuce-awesome.html' },
} satisfies Record<string, NasaSource>;

export const NASA_MISSIONS: NasaMission[] = [
    {
        id: 'ice_hunter',
        title: 'Ice Hunter',
        planet: 'mars',
        briefing: 'Water is the most precious thing on Mars. You can drink it, water plants with it, and split it into oxygen. Drive to the crater rim and drill for buried ice.',
        objective: 'Drill an ice core for 1 sol',
        realBasis: {
            mission: 'Phoenix lander (2008) and the RIMFAX ground radar on Perseverance',
            fact: 'In 2008 the Phoenix lander dug a trench and found bright, dice-sized chunks. Four days later they were gone: they were water ice turning straight into vapour.',
            sources: [SRC.phoenixIce, SRC.perseverance],
        },
        cardBasis: 'the Phoenix lander',
        lesson: 'The crater rim is far away. A long trip means packing much more food, water and air, leaving less room for everything else.',
        site: { name: 'Jezero Crater Rim', coords: '18.50N, 77.33E', distanceMP: 45 },
        taskSols: 1,
        spareSols: 5,
        durationHours: 24,
        sensorLabel: 'Prep Ice Drill',
        goalFlag: 'ice_core_collected',
        requiredEquipment: { windSampler: 1 },
        image: 'assets/textures/mission_2.png',
    },
    {
        id: 'moon_shadow_ice',
        title: 'Shadow Ice',
        planet: 'moon',
        briefing: 'Some craters at the Moon\'s south pole never see sunlight, so ice has stayed frozen there for ages. Drill a core from the dark floor.',
        objective: 'Drill polar ice for 1 sol',
        realBasis: {
            mission: 'LCROSS (2009)',
            fact: 'In 2009 NASA crashed a rocket stage into Cabeus Crater and flew LCROSS through the cloud it threw up. Its instruments found water: the first proof of ice in the Moon\'s dark craters.',
            sources: [SRC.lcross],
        },
        cardBasis: 'LCROSS',
        lesson: 'The Moon has no air at all. Every breath comes from the oxygen tanks you pack, and every tank takes cargo space.',
        // LCROSS hit Cabeus, so the fact shown is only true at this site.
        site: { name: 'Cabeus Crater', coords: '84.9S, 35.5W', distanceMP: 35 },
        taskSols: 1,
        spareSols: 5,
        durationHours: 24,
        sensorLabel: 'Prep Drill Sensor',
        goalFlag: 'ice_core_collected',
        requiredEquipment: { windSampler: 1 },
        image: 'assets/textures/missions/map_lunar_south_pole_320x180.png',
    },
    {
        id: 'oxygen_maker',
        title: 'Breathe Easy',
        planet: 'mars',
        briefing: 'Mars air is mostly carbon dioxide. Test an oxygen maker out in the field, so future crews can make air instead of carrying it.',
        objective: 'Run the oxygen maker for 4 sols',
        realBasis: {
            mission: 'MOXIE on the Perseverance rover',
            fact: 'MOXIE made 122 grams of oxygen on Mars, about what a small dog breathes in 10 hours. At its best it made 12 grams per hour, at 98% purity or better.',
            sources: [SRC.moxie],
        },
        cardBasis: 'MOXIE on Perseverance',
        lesson: 'Making oxygen means carrying fewer tanks, but the machine needs a lot of power. You trade electricity for air.',
        site: { name: 'Three Forks', coords: '18.45N, 77.42E', distanceMP: 15 },
        taskSols: 4,
        spareSols: 6,
        durationHours: 96,
        sensorLabel: 'Prep Oxygen Maker',
        goalFlag: 'oxygen_produced',
        requiredEquipment: { batteryPacks: 2 },
        image: 'assets/textures/mission_3.png',
    },
    {
        id: 'space_garden',
        title: 'Space Garden',
        planet: 'mars',
        briefing: 'Fresh food keeps the crew healthy and happy. Set up a test greenhouse near the base and grow the first Martian salad.',
        objective: 'Grow and harvest plants for 5 sols',
        realBasis: {
            mission: 'NASA Veggie plant system on the International Space Station',
            fact: 'On August 10, 2015, astronauts on the Space Station ate the first lettuce grown in the Veggie garden for eating in space. It grew for 33 days under LED lights.',
            sources: [SRC.veggie],
        },
        cardBasis: 'Veggie on the Space Station',
        lesson: 'Plants need water and light, and light needs power. Growing food costs supplies now but means carrying less food later.',
        site: { name: 'Octavia E. Butler Landing', coords: '18.44N, 77.45E', distanceMP: 5 },
        taskSols: 5,
        spareSols: 6,
        durationHours: 120,
        sensorLabel: 'Prep Grow Beds',
        goalFlag: 'crop_harvested',
        requiredEquipment: { seedPods: 2, waterCanisters: 1 },
        image: 'assets/textures/outpost/events/event_cloudy_plant_tanks_256x144.png',
    },
    {
        id: 'radiation_detective',
        title: 'Radiation Detective',
        planet: 'mars',
        briefing: 'Mars has no magnetic shield and very thin air, so radiation from space reaches the ground. Measure how much, and keep the crew safe while you do it.',
        objective: 'Measure radiation for 4 sols',
        realBasis: {
            mission: 'RAD (Radiation Assessment Detector) on Curiosity',
            fact: 'RAD measured about 0.67 millisieverts per day on the surface of Mars, and about 1.8 per day inside the spacecraft on the way there. NASA\'s DONKI database tracks the solar storms that make it worse.',
            sources: [SRC.rad, SRC.donki],
        },
        cardBasis: 'RAD on Curiosity',
        lesson: 'Medkits take cargo space, but when the Sun flares they keep the crew healthy enough to finish the job.',
        site: { name: 'Hawksbill Gap', coords: '18.46N, 77.41E', distanceMP: 20 },
        taskSols: 4,
        spareSols: 5,
        durationHours: 96,
        sensorLabel: 'Prep Radiation Detector',
        goalFlag: 'radiation_measured',
        requiredEquipment: { medkits: 2 },
        image: 'assets/textures/outpost/events/event_solar_flare_alert_256x144.png',
    },
];

export function travelSols(mission: NasaMission): number {
    return Math.max(1, Math.ceil(mission.site.distanceMP / ROVER_MP_PER_SOL));
}

/** Full MissionSetupInput; crew and cargo are filled in later by the launch flow. */
export function nasaMissionSetup(mission: NasaMission): MissionSetupInput {
    const base = cloneSetup(mission.planet === 'moon' ? MOON_TEST_SETUP : DEFAULT_MARS_SETUP);
    const deadline = 1 + travelSols(mission) + mission.taskSols + mission.spareSols;
    const { site } = mission;
    return {
        ...base,
        planet: mission.planet,
        targetSol: deadline,
        missionGoal: {
            id: `goal_${mission.id}`,
            title: mission.title,
            description: `${mission.objective} at ${site.name} by the end of Sol ${deadline}.`,
            coords: site.coords,
            durationHours: mission.durationHours,
            deadlineSol: deadline,
            requiredFlag: mission.goalFlag,
            requirements: [
                { id: 'req_sensor', label: mission.sensorLabel, kind: 'prep_sensor', current: 0, target: 1 },
                { id: 'req_rover', label: 'Prep Rover', kind: 'prep_rover', current: 0, target: 1 },
                { id: 'req_supplies', label: 'Prep Supplies (Food, O2, H2O)', kind: 'prep_supplies', current: 0, target: 4 },
                { id: 'req_crew', label: 'Assign Crew', kind: 'assign_crew', current: 0, target: 2 },
            ],
            minimumReserves: { ...MINIMUM_RESERVES },
            requiredEquipment: { ...mission.requiredEquipment },
            completed: false,
        },
    };
}

/** The picker card for each mission, with its briefing for the popup. */
export function nasaMissionOffers() {
    return NASA_MISSIONS.map((m) => {
        const setup = nasaMissionSetup(m);
        return {
            title: m.title,
            site: `${m.planet === 'moon' ? 'MOON' : 'MARS'} · ${m.site.name.toUpperCase()}`,
            // The card shows the goal only; the site, deadline and NASA mission each have their own place.
            description: `${m.objective}.`,
            image: m.image,
            setup,
            briefing: {
                task: m.briefing,
                basis: m.cardBasis,
                fact: m.realBasis.fact,
                lesson: m.lesson,
                source: m.realBasis.sources[0]?.label ?? '',
            },
        };
    });
}

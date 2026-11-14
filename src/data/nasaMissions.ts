// NASA-based missions for the mission picker. Each one copies a job a real NASA
// mission or instrument did, shows the player that fact with its source in the
// briefing popup, and becomes a full MissionSetupInput in the same format as the
// Tharsis survey (deadline, prep requirements, minimum reserves, required cargo).
//
// Coordinates are approximate (Jezero Crater ≈ 18.4°N 77.5°E; lunar south pole).
// Distances are game values (movement points), not real kilometres.
import {
    cloneSetup, DEFAULT_MARS_SETUP,
    type CargoItemId, type GoalFlag, type MissionSetupInput, type PlanetId,
} from '../contracts/gameContract';
import { EXPEDITION_RESERVES, expeditionOf, expeditionRequirements, type ExpeditionId } from './expeditions';

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

/** 1 Easy, 2 Medium, 3 Hard. Shown as a bar on the mission card. */
export type MissionDifficulty = 1 | 2 | 3;

/**
 * Why each mission has its difficulty. Harder means some mix of: a tighter deadline for the work,
 * more cargo the mission forces you to pack, or a place that is harder to survive.
 *   Easy   Breathe Easy: a short drive, 4 sols of work with 6 spare, one item type to pack.
 *   Medium Space Garden: 5 sols of work and the tightest deadline (Sol 13), three items to pack.
 *   Medium Ice Hunter: a short job, but the long drive means supplies must last 16 sols.
 *   Hard   Shadow Ice (Moon): no air, so every breath is packed, and a long drive across the pole.
 *   Hard   Radiation Detective: 4 sols out in radiation; solar storms hurt the crew.
 * The picker shows three per page, ordered so each page runs Easy, Medium, Hard
 * and mixes planets, jobs and cargo (the Tharsis survey is the Easy one on page 1).
 */
export interface NasaMission {
    id: string;
    title: string;
    planet: PlanetId;
    /** How hard the run is (1 Easy, 2 Medium, 3 Hard); see DIFFICULTY_BASIS. */
    difficulty: MissionDifficulty;
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
    goalFlag: GoalFlag;
    /** Cargo that Cargo Preparation must contain before launch. */
    requiredEquipment: Partial<Record<CargoItemId, number>>;
    /** Card and popup picture. */
    image: string;
    /** Playable missions run as an expedition (src/data/expeditions.ts); the rest are "Coming soon". */
    expedition?: { id: Exclude<ExpeditionId, 'tharsis'>; deadline: number };
}


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
        id: 'radiation_detective',
        title: 'Radiation Detective',
        difficulty: 2,
        planet: 'mars',
        briefing: 'Mars has no magnetic shield and very thin air, so radiation from space reaches the ground. Drive the RAD detector to Hawksbill Gap, record 72 hours of readings, and keep the crew safe through a solar storm.',
        objective: 'Record 72 hours of radiation readings',
        realBasis: {
            mission: 'RAD (Radiation Assessment Detector) on Curiosity',
            fact: 'RAD measured about 0.67 millisieverts per day on the surface of Mars, and about 1.8 per day inside the spacecraft on the way there. NASA\'s DONKI database tracks the solar storms that make it worse.',
            sources: [SRC.rad, SRC.donki],
        },
        cardBasis: 'RAD on Curiosity',
        lesson: 'Medkits take cargo space, but when the Sun flares they keep the crew healthy enough to finish the job.',
        site: { name: 'Hawksbill Gap', coords: '18.46N, 77.41E', distanceMP: 20 },
                        goalFlag: 'radiation_measured',
        requiredEquipment: { radDetector: 1 },
        image: 'assets/textures/outpost/events/event_solar_flare_alert_256x144.png',
        expedition: { id: 'radiation', deadline: 16 },
    },
    {
        id: 'ice_hunter',
        title: 'Ice Hunter',
        difficulty: 3,
        planet: 'mars',
        briefing: 'Water is the most precious thing on Mars. You can drink it, water plants with it, and split it into oxygen. Drive the ice drill to the crater rim, a long trip in deep cold, and drill for 48 hours.',
        objective: 'Drill 48 hours of ice cores at the crater rim',
        realBasis: {
            mission: 'Phoenix lander (2008) and the RIMFAX ground radar on Perseverance',
            fact: 'In 2008 the Phoenix lander dug a trench and found bright, dice-sized chunks. Four days later they were gone: they were water ice turning straight into vapour.',
            sources: [SRC.phoenixIce, SRC.perseverance],
        },
        cardBasis: 'the Phoenix lander',
        lesson: 'The crater rim is far away. A long trip means packing much more food, water and air, leaving less room for everything else.',
        site: { name: 'Jezero Crater Rim', coords: '18.50N, 77.33E', distanceMP: 45 },
                        goalFlag: 'ice_core_collected',
        requiredEquipment: { iceDrill: 1 },
        image: 'assets/textures/mission_2.png',
        expedition: { id: 'ice', deadline: 18 },
    },
    {
        id: 'moon_shadow_ice',
        title: 'Shadow Ice',
        difficulty: 3,
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
                        goalFlag: 'ice_core_collected',
        requiredEquipment: { windSampler: 1 },
        image: 'assets/textures/missions/map_lunar_south_pole_320x180.png',
    },
    {
        id: 'oxygen_maker',
        title: 'Breathe Easy',
        difficulty: 1,
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
                        goalFlag: 'oxygen_produced',
        requiredEquipment: { batteryPacks: 2 },
        image: 'assets/textures/mission_3.png',
    },
    {
        id: 'space_garden',
        title: 'Space Garden',
        difficulty: 2,
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
                        goalFlag: 'crop_harvested',
        requiredEquipment: { seedPods: 2, waterCanisters: 1 },
        image: 'assets/textures/outpost/events/event_cloudy_plant_tanks_256x144.png',
    },
];

/** A playable mission's setup: the same expedition base as the Tharsis survey, with its own profile. */
export function expeditionSetup(mission: NasaMission): MissionSetupInput | undefined {
    if (!mission.expedition) return undefined;
    const { id, deadline } = mission.expedition;
    const profile = expeditionOf(id);
    const base = cloneSetup(DEFAULT_MARS_SETUP);
    return {
        ...base,
        rules: 'tharsis-expedition',
        expedition: id,
        planet: mission.planet,
        targetSol: deadline,
        missionGoal: {
            ...base.missionGoal,
            id: `goal_${mission.id}`,
            title: mission.title,
            description: `${mission.objective} and return by Sol ${deadline}.`,
            coords: mission.site.coords,
                    deadlineSol: deadline,
            requiredFlag: mission.goalFlag,
            requirements: expeditionRequirements(),
            minimumReserves: { ...EXPEDITION_RESERVES },
            requiredEquipment: { ...mission.requiredEquipment },
            completed: false,
        },
    };
}

/** The picker card for each mission, with its briefing for the popup. Missions without an expedition are "Coming soon". */
export function nasaMissionOffers() {
    return NASA_MISSIONS.map((m) => {
        const setup = expeditionSetup(m);
        return {
            title: m.title,
            site: `${m.planet === 'moon' ? 'MOON' : 'MARS'} · ${m.site.name.toUpperCase()}`,
            // The card shows the goal only; the site, deadline and NASA mission each have their own place.
            description: `${m.objective}.`,
            image: m.image,
            difficulty: m.difficulty,
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

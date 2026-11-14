import type { MissionSite, PrepMission, Source } from './types';

// ---------------------------------------------------------------------------
// Mission pool. Each mission copies a job a real NASA mission did and shows the
// player that fact + a source. Only missions whose `goalFlag` the main loop
// understands are playable today; the rest wait for docs/CONTRACT-PROPOSAL.md.
//
// Coordinates are approximate (Jezero Crater ≈ 18.4°N 77.5°E; lunar south pole).
// Check them in NASA Mars Trek / Moon Trek before calling them exact.
// `map` positions are where the pins sit on the pixel crater maps.
// ---------------------------------------------------------------------------

export const MARS_BASE = { name: 'Octavia E. Butler Landing', map: { x: 0.68, y: 0.56 } };
export const MOON_BASE = { name: 'Connecting Ridge Base', map: { x: 0.52, y: 0.5 } };

export const SITES = {
    belva: { id: 'belva', name: 'Belva Crater', coords: '18.47N, 77.39E', distanceMP: 25, map: { x: 0.3, y: 0.3 } },
    seitah: { id: 'seitah', name: 'Séítah', coords: '18.43N, 77.44E', distanceMP: 10, map: { x: 0.5, y: 0.7 } },
    craterRim: { id: 'crater_rim', name: 'Jezero Crater Rim', coords: '18.50N, 77.33E', distanceMP: 45, map: { x: 0.12, y: 0.2 } },
    neretva: { id: 'neretva', name: 'Neretva Vallis', coords: '18.48N, 77.38E', distanceMP: 30, map: { x: 0.2, y: 0.5 } },
    cabeus: { id: 'cabeus', name: 'Cabeus Crater', coords: '84.9S, 35.5W', distanceMP: 35, map: { x: 0.2, y: 0.32 } },
    shackleton: { id: 'shackleton', name: 'Shackleton Crater', coords: '89.9S, 0.0E', distanceMP: 15, map: { x: 0.7, y: 0.68 } },
} satisfies Record<string, MissionSite>;

const SRC: Record<string, Source> = {
    opportunityEnd: {
        label: 'NASA: Opportunity rover mission comes to end (2019)',
        url: 'https://www.nasa.gov/news-release/nasas-record-setting-opportunity-rover-mission-on-mars-comes-to-end/',
    },
    perseverance: {
        label: 'NASA Science: Perseverance instruments',
        url: 'https://science.nasa.gov/mission/mars-2020-perseverance/science-instruments/',
    },
    phoenixIce: {
        label: 'NASA Astrobiology: Phoenix lander found ice (2008)',
        url: 'https://astrobiology.nasa.gov/news/bright-chunks-at-phoenix-landers-mars-site-must-have-been-ice/',
    },
    lcross: {
        label: 'NASA Science: LCROSS mission',
        url: 'https://science.nasa.gov/mission/lcross/',
    },
    moxie: {
        label: 'NASA JPL: MOXIE completes Mars mission (2023)',
        url: 'https://www.jpl.nasa.gov/news/nasas-oxygen-generating-experiment-moxie-completes-mars-mission/',
    },
    insight: {
        label: 'NASA JPL: NASA retires InSight Mars lander (2022)',
        url: 'https://www.jpl.nasa.gov/news/nasa-retires-insight-mars-lander-mission-after-years-of-science',
    },
    ingenuity: {
        label: "NASA: Ingenuity's mission ends (2024)",
        url: 'https://www.nasa.gov/news-release/after-three-years-on-mars-nasas-ingenuity-helicopter-mission-ends/',
    },
    rad: {
        label: 'SwRI: First radiation measurements from the surface of Mars',
        url: 'https://www.swri.org/press-release/swri-scientists-publish-first-radiation-measurements-surface-mars',
    },
    veggie: {
        label: 'Phys.org: First bite of space-grown lettuce (NASA Veggie, 2015)',
        url: 'https://phys.org/news/2015-08-space-grown-lettuce-awesome.html',
    },
    threeForks: {
        label: 'NASA Photojournal PIA25681: Three Forks sample depot',
        url: 'https://photojournal.jpl.nasa.gov/catalog/PIA25681',
    },
};

export const MISSIONS: PrepMission[] = [
    // ---- Playable now (main loop supports these goal flags) ----------------
    {
        id: 'storm_watch',
        title: 'Storm Watch',
        planet: 'mars',
        briefing: 'Dust storm season is starting. Set up a weather sensor and record the storm so the base gets better warnings.',
        objective: 'Record weather data for 2 sols',
        realBasis: {
            mission: 'MEDA weather station (Perseverance) and REMS (Curiosity)',
            fact: 'In 2018 a dust storm covered all of Mars. It blocked so much sunlight that the solar-powered Opportunity rover ran out of power and never woke up again.',
            sources: [SRC.opportunityEnd, SRC.perseverance],
        },
        lesson: 'Dust storms block sunlight, so solar power drops. Battery packs take rocket space, but they keep the outpost running in the dark.',
        difficulty: 1,
        sites: [SITES.belva, SITES.seitah],
        taskSols: 2,
        slackSols: [5, 8],
        durationHours: 48,
        recommendedRoles: ['pilot', 'engineer'],
        hardware: [{ itemId: 'weather_sensor', count: 1 }],
        sensorLabel: 'Prep Weather Sensor',
        hazards: ['dust_storm', 'dust_on_panels'],
        goalFlag: 'wind_sample_collected',
    },
    {
        id: 'ice_hunter',
        title: 'Ice Hunter',
        planet: 'mars',
        briefing: 'Water is the most precious thing on Mars: you can drink it, grow plants and even split it into oxygen. Drill for buried ice at the crater rim.',
        objective: 'Drill an ice core for 1 sol',
        realBasis: {
            mission: 'Phoenix lander (2008) and the RIMFAX ground radar on Perseverance',
            fact: 'In 2008 the Phoenix lander dug a trench and found bright, dice-sized chunks. Four days later they were gone: they were water ice turning straight into vapour.',
            sources: [SRC.phoenixIce, SRC.perseverance],
        },
        lesson: 'The crater rim is far away. A long trip means packing much more food, water and air, leaving less room for everything else.',
        difficulty: 3,
        sites: [SITES.craterRim, SITES.neretva],
        taskSols: 1,
        slackSols: [3, 5],
        durationHours: 24,
        recommendedRoles: ['pilot', 'engineer'],
        hardware: [{ itemId: 'ice_drill', count: 1 }],
        sensorLabel: 'Prep Ice Drill',
        hazards: ['cold_snap', 'rough_terrain'],
        goalFlag: 'ice_core_collected',
    },
    {
        id: 'moon_shadow_ice',
        title: 'Shadow Ice',
        planet: 'moon',
        briefing: 'Some craters at the Moon\'s south pole never see sunlight, so ice has stayed frozen there for ages. Drill a core from the dark floor.',
        objective: 'Drill a polar ice core for 1 sol',
        realBasis: {
            mission: 'LCROSS (2009)',
            fact: 'In 2009 NASA crashed a rocket stage into Cabeus Crater and flew LCROSS through the cloud it threw up. Its instruments found water: the first proof of ice in the Moon\'s dark craters.',
            sources: [SRC.lcross],
        },
        lesson: 'The Moon has no air at all. Every breath comes from the oxygen you pack, so air and space are always fighting.',
        difficulty: 2,
        // LCROSS hit Cabeus, so the fact shown is only true at this site.
        sites: [SITES.cabeus],
        taskSols: 1,
        slackSols: [3, 5],
        durationHours: 24,
        recommendedRoles: ['engineer', 'medic'],
        hardware: [{ itemId: 'ice_drill', count: 1 }],
        sensorLabel: 'Prep Drill Sensor',
        hazards: ['solar_flare', 'cold_snap'],
        goalFlag: 'ice_core_collected',
    },
    // ---- Waiting for the contract proposal (hidden from the roll) ----------
    hidden('oxygen_maker', 'Breathe Easy', 'MOXIE on Perseverance', 'MOXIE made 122 grams of oxygen on Mars. At its best it made 12 grams per hour, at 98% purity or better.', [SRC.moxie]),
    hidden('quake_listen', 'Quake Listener', 'SEIS seismometer on InSight', 'InSight felt 1,319 marsquakes. Its mission ended in December 2022 when dust covered its solar panels.', [SRC.insight]),
    hidden('sky_scout', 'Sky Scout', 'Ingenuity Mars Helicopter', 'Ingenuity was planned for 5 flights and flew 72 times over almost 3 years.', [SRC.ingenuity]),
    hidden('radiation_detective', 'Radiation Detective', 'RAD on Curiosity', 'RAD measured about 0.67 millisieverts per day on the surface of Mars.', [SRC.rad]),
    hidden('space_garden', 'Space Garden', 'NASA Veggie (Space Station)', 'On August 10, 2015, astronauts ate the first lettuce grown for eating in space.', [SRC.veggie]),
    hidden('sample_depot', 'Rock Collector', 'Perseverance sample depot', 'In January 2023 Perseverance finished a depot of 10 sample tubes at Three Forks.', [SRC.threeForks]),
];

/** A mission the main loop can't play yet. Full design lives in docs/MISSIONS.md. */
function hidden(id: string, title: string, mission: string, fact: string, sources: Source[]): PrepMission {
    return {
        id, title, planet: 'mars',
        briefing: '', objective: '',
        realBasis: { mission, fact, sources },
        lesson: '', difficulty: 2,
        sites: [SITES.seitah], taskSols: 2, slackSols: [4, 6], durationHours: 48,
        recommendedRoles: [], hardware: [], sensorLabel: 'Prep Sensor', hazards: [],
        goalFlag: null,
    };
}

export const PLAYABLE_MISSIONS = MISSIONS.filter((m) => m.goalFlag !== null);

export const HAZARD_INFO: Record<string, { name: string; tip: string }> = {
    dust_storm: { name: 'Dust storm', tip: 'Solar power drops a lot. Pack battery packs.' },
    solar_flare: { name: 'Solar flare', tip: 'A burst of radiation from the Sun. A medic helps the crew recover.' },
    dust_on_panels: { name: 'Dusty panels', tip: 'Dust settles on solar panels every day and slowly steals power.' },
    cold_snap: { name: 'Cold snap', tip: 'Nights drop far below freezing. Heaters burn extra power.' },
    rough_terrain: { name: 'Rough terrain', tip: 'Sharp rocks slow the rover and break parts. Pack repair kits.' },
    comms_blackout: { name: 'Comms blackout', tip: 'No contact with Earth for a while. The crew decides alone.' },
    equipment_failure: { name: 'Equipment failure', tip: 'Something breaks. Repair kits fix it.' },
};

const BY_ID = new Map(MISSIONS.map((m) => [m.id, m]));
export function getMission(id: string): PrepMission {
    const m = BY_ID.get(id);
    if (!m) throw new Error(`Unknown mission '${id}'`);
    return m;
}

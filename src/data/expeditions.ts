// Expedition profiles: what makes each station + rover mission different.
//
// Every playable mission runs Mokhtar's expedition engine (src/simulation/tharsis.ts): work orders
// at the station, a two-person rover trip to a survey site, a timed survey with one instrument,
// a three-Sol hazard, and a return with the data before the deadline. A profile only changes the
// numbers and the words; the rules are the same for all of them.
//
import type { CargoItemId, ExpeditionId, MissionRequirement, WeatherType } from '../contracts/gameContract';
import { expeditionChecklist } from './tharsisOrders';
export type { ExpeditionId } from '../contracts/gameContract';

export interface Expedition {
    id: ExpeditionId;
    /** Where the station is: the big title on the run screen. */
    region: string;
    /** The survey site the rover drives to. */
    site: string;
    /** The instrument the rover must carry for the survey. */
    instrument: CargoItemId;
    /** Consecutive hours of data needed at the site (a multiple of 24). */
    surveyHours: number;
    /** What the data is, for the debrief and reports ("weather data"). */
    dataKind: string;
    /** Sols per travel leg, with a Pilot driving or with a backup driver. */
    legs: { pilot: number; backup: number };
    /** The three-Sol hazard. It starts on firstSol + (seed % spread). */
    hazard: {
        kind: 'dust' | 'solar';
        firstSol: number;
        spread: number;
        /** Radiation multiplier on hazard Sols (a solar storm is harsher than dust). */
        exposure: number;
    };
    /** Temperatures (°C) on clear, warning and hazard Sols. */
    temperature: { clear: number; warning: number; hazard: number };
    /** Sol 1 briefing from mission control. `{deadline}` is replaced with the mission deadline. */
    intro: string;
    /** One line describing the mission for the A.R.I.E.S. prompt. */
    aries: string;
    /** Diagnostic examples for the A.R.I.E.S. prompt. */
    ariesExamples: string;
}

export const EXPEDITIONS: Record<ExpeditionId, Expedition> = {
    tharsis: {
        id: 'tharsis', region: 'Tharsis Ridge', site: 'Site A', instrument: 'windSampler', surveyHours: 48, dataKind: 'weather data',
        legs: { pilot: 1, backup: 2 },
        hazard: { kind: 'dust', firstSol: 8, spread: 3, exposure: 1 },
        temperature: { clear: -58, warning: -64, hazard: -76 },
        intro: 'Site A is just past the ridge. Get the rover, weather tool, supplies, and 2 crew ready. Bring the crew back with 48 hours of weather data by Sol {deadline}. Watch out for dust storms!',
        aries: 'the Tharsis Ridge weather survey',
        ariesExamples: 'MEDA wind and pressure checks, scheduled relay contacts, power load isolation, water-recovery conductivity checks and oxygen-generator inlet faults',
    },
    radiation: {
        id: 'radiation', region: 'Jezero Crater', site: 'Hawksbill Gap', instrument: 'radDetector', surveyHours: 72, dataKind: 'radiation readings',
        legs: { pilot: 1, backup: 2 },
        hazard: { kind: 'solar', firstSol: 7, spread: 3, exposure: 1.35 },
        temperature: { clear: -55, warning: -55, hazard: -57 },
        intro: 'Hawksbill Gap is an open hill with no cover. Get the rover, radiation sensor, supplies, and 2 crew ready. Bring back 72 hours of readings by Sol {deadline}. A solar storm is coming!',
        aries: 'the Hawksbill Gap radiation survey (a RAD-style detector measuring surface radiation)',
        ariesExamples: 'RAD-style detector calibration and dose checks, solar particle alerts, scheduled relay contacts, power load isolation and oxygen-generator inlet faults',
    },
    ice: {
        id: 'ice', region: 'Jezero Crater', site: 'the crater rim', instrument: 'iceDrill', surveyHours: 48, dataKind: 'ice cores',
        legs: { pilot: 2, backup: 3 },
        hazard: { kind: 'dust', firstSol: 9, spread: 3, exposure: 1 },
        temperature: { clear: -70, warning: -78, hazard: -90 },
        intro: 'The ice is buried under the crater rim, a long drive away. Get the rover, ice drill, supplies, and 2 crew ready. Bring back 48 hours of ice samples by Sol {deadline}. It is freezing cold and dusty!',
        aries: 'the crater-rim ice drilling expedition (shallow subsurface water ice)',
        ariesExamples: 'drill torque and bit temperature checks, core-tube seals, heater and battery faults in the cold, scheduled relay contacts and oxygen-generator inlet faults',
    },
    training: {
        id: 'training', region: 'Tharsis Training Range', site: 'Training Marker', instrument: 'windSampler', surveyHours: 24, dataKind: 'weather data',
        legs: { pilot: 1, backup: 2 },
        hazard: { kind: 'dust', firstSol: 8, spread: 1, exposure: 1 },
        temperature: { clear: -58, warning: -58, hazard: -58 },
        intro: 'Get the rover ready, record 24 hours of weather at Training Marker, and bring the data home by Sol {deadline}. Follow the guide step by step!',
        aries: 'the Tharsis training run',
        ariesExamples: 'weather instrument checks and relay contacts',
    },
    shadow_ice: {
        id: 'shadow_ice', region: 'Cabeus Crater', site: 'the permanently shadowed floor', instrument: 'iceDrill', surveyHours: 72, dataKind: 'lunar ice cores',
        legs: { pilot: 2, backup: 3 },
        hazard: { kind: 'solar', firstSol: 7, spread: 3, exposure: 1.5 },
        temperature: { clear: -120, warning: -145, hazard: -180 },
        intro: 'Cabeus Crater is in permanent shadow at -180°C with zero atmosphere. Pack heavy O₂ and power, drill 72 hours of ice cores, and return by Sol {deadline}.',
        aries: 'the Cabeus Crater lunar south pole ice expedition',
        ariesExamples: 'cryogenic drill heaters, oxygen seal checks in vacuum, and solar particle storm shielding',
    },
    oxygen_maker: {
        id: 'oxygen_maker', region: 'Three Forks', site: 'MOXIE Test Pad', instrument: 'windSampler', surveyHours: 96, dataKind: 'MOXIE oxygen logs',
        legs: { pilot: 1, backup: 2 },
        hazard: { kind: 'dust', firstSol: 6, spread: 3, exposure: 1.1 },
        temperature: { clear: -60, warning: -68, hazard: -80 },
        intro: 'Three Forks tests field ISRU oxygen production. Run 96 hours of atmospheric electrolysis at the test pad and return by Sol {deadline}.',
        aries: 'the Three Forks MOXIE oxygen-production field trial',
        ariesExamples: 'CO2 compressor intake dust clearing, solid-oxide cell power draw, and purity telemetry',
    },
    space_garden: {
        id: 'space_garden', region: 'Butler Landing', site: 'Greenhouse Ridge', instrument: 'windSampler', surveyHours: 96, dataKind: 'botanical growth logs',
        legs: { pilot: 1, backup: 2 },
        hazard: { kind: 'solar', firstSol: 6, spread: 4, exposure: 1.25 },
        temperature: { clear: -56, warning: -64, hazard: -74 },
        intro: 'Butler Landing hosts our remote Veggie field dome. Record 96 hours of crop growth telemetry and return before Sol {deadline}!',
        aries: 'the Butler Landing greenhouse field experiment',
        ariesExamples: 'LED array power balancing, hydroponic moisture recovery, and solar radiation shielding',
    },
    infinite: {
        id: 'infinite', region: 'Elysium Outpost', site: 'Elysium Plains', instrument: 'windSampler', surveyHours: 48, dataKind: 'endless survey data',
        legs: { pilot: 1, backup: 2 },
        hazard: { kind: 'dust', firstSol: 5, spread: 3, exposure: 1.15 },
        temperature: { clear: -62, warning: -74, hazard: -88 },
        intro: 'No rescue ship is scheduled. Keep the crew alive through escalating storms as many Sols as you can, and run rover surveys for bonus score.',
        aries: 'Elysium Outpost endless survival operations',
        ariesExamples: 'long-term life support rationing, recurring dust storm survival, and emergency salvage',
    },
};

export const INSTRUMENTS: readonly CargoItemId[] = [...new Set(Object.values(EXPEDITIONS).map(expedition => expedition.instrument))];

export function expeditionOf(id: ExpeditionId | undefined): Expedition {
    return EXPEDITIONS[id ?? 'tharsis'] ?? EXPEDITIONS.tharsis;
}

/** The weather on a hazard Sol, and on the warning Sol before it. */
export function hazardWeather(expedition: Expedition): { warning: WeatherType; hazard: WeatherType } {
    return expedition.hazard.kind === 'solar'
        ? { warning: 'Clear', hazard: 'Solar Flare' }
        : { warning: 'Dust Haze', hazard: 'Dust Storm' };
}

/** The launch checklist every expedition shares (the work-order groups in data/tharsisOrders.ts). */
export function expeditionRequirements(id: ExpeditionId = 'tharsis'): MissionRequirement[] {
    const details = {
        prep_rover: ['req_rover', 'Rover work orders'],
        prep_sensor: ['req_sensor', 'Instrument checks'],
        prep_supplies: ['req_supplies', 'Field supply checks'],
        assign_crew: ['req_crew', 'Field crew checks'],
    } as const;
    return expeditionChecklist(id).map(({ kind, orders }) => {
        const [requirementId, label] = details[kind];
        return { id: requirementId, label, kind, current: 0, target: orders.length };
    });
}

/** Every expedition keeps the same reserves on return. */
export const EXPEDITION_RESERVES = { food: 8, water: 8, oxygen: 20 } as const;

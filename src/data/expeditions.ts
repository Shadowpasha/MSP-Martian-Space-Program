// Expedition profiles: what makes each station + rover mission different.
//
// Every playable mission runs Mokhtar's expedition engine (src/simulation/tharsis.ts): work orders
// at the station, a two-person rover trip to a survey site, a timed survey with one instrument,
// a three-Sol hazard, and a return with the data before the deadline. A profile only changes the
// numbers and the words; the rules are the same for all of them.
//
import type { CargoItemId, MissionRequirement, WeatherType } from '../contracts/gameContract';

export type ExpeditionId = 'tharsis' | 'radiation' | 'ice';

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
        intro: 'Site A lies beyond the ridge. Prepare the rover, instruments, supplies, and field crew. Return the crew and 48 consecutive hours of data by Sol {deadline}. Seasonal dust risk is elevated. The launch checklist tracks your work orders.',
        aries: 'the Tharsis Ridge weather survey',
        ariesExamples: 'MEDA wind and pressure checks, scheduled relay contacts, power load isolation, water-recovery conductivity checks and oxygen-generator inlet faults',
    },
    radiation: {
        id: 'radiation', region: 'Jezero Crater', site: 'Hawksbill Gap', instrument: 'radDetector', surveyHours: 72, dataKind: 'radiation readings',
        legs: { pilot: 1, backup: 2 },
        hazard: { kind: 'solar', firstSol: 7, spread: 3, exposure: 1.35 },
        temperature: { clear: -55, warning: -55, hazard: -57 },
        intro: 'Hawksbill Gap is an open slope with no cover. Prepare the rover, the RAD detector, supplies, and field crew. Return the crew and 72 consecutive hours of radiation readings by Sol {deadline}. The Sun is active: a solar particle storm is expected. The launch checklist tracks your work orders.',
        aries: 'the Hawksbill Gap radiation survey (a RAD-style detector measuring surface radiation)',
        ariesExamples: 'RAD-style detector calibration and dose checks, solar particle alerts, scheduled relay contacts, power load isolation and oxygen-generator inlet faults',
    },
    ice: {
        id: 'ice', region: 'Jezero Crater', site: 'the crater rim', instrument: 'iceDrill', surveyHours: 48, dataKind: 'ice cores',
        legs: { pilot: 2, backup: 3 },
        hazard: { kind: 'dust', firstSol: 9, spread: 3, exposure: 1 },
        temperature: { clear: -70, warning: -78, hazard: -90 },
        intro: 'The ice lies under the crater rim, a long drive away. Prepare the rover, the ice drill, supplies, and field crew. Return the crew and 48 hours of drilled ice cores by Sol {deadline}. Nights are bitterly cold and seasonal dust risk is elevated. The launch checklist tracks your work orders.',
        aries: 'the crater-rim ice drilling expedition (shallow subsurface water ice)',
        ariesExamples: 'drill torque and bit temperature checks, core-tube seals, heater and battery faults in the cold, scheduled relay contacts and oxygen-generator inlet faults',
    },
};

export const INSTRUMENTS: readonly CargoItemId[] = Object.values(EXPEDITIONS).map(expedition => expedition.instrument);

export function expeditionOf(id: ExpeditionId | undefined): Expedition {
    return EXPEDITIONS[id ?? 'tharsis'];
}

/** The weather on a hazard Sol, and on the warning Sol before it. */
export function hazardWeather(expedition: Expedition): { warning: WeatherType; hazard: WeatherType } {
    return expedition.hazard.kind === 'solar'
        ? { warning: 'Clear', hazard: 'Solar Flare' }
        : { warning: 'Dust Haze', hazard: 'Dust Storm' };
}

/** The launch checklist every expedition shares (the work-order groups in data/tharsisOrders.ts). */
export function expeditionRequirements(): MissionRequirement[] {
    return [
        { id: 'req_rover', label: 'Rover work orders', kind: 'prep_rover', current: 0, target: 3 },
        { id: 'req_sensor', label: 'Instrument checks', kind: 'prep_sensor', current: 0, target: 3 },
        { id: 'req_supplies', label: 'Field supply checks', kind: 'prep_supplies', current: 0, target: 2 },
        { id: 'req_crew', label: 'Field crew checks', kind: 'assign_crew', current: 0, target: 2 },
    ];
}

/** Every expedition keeps the same reserves on return. */
export const EXPEDITION_RESERVES = { food: 10, water: 10, oxygen: 25 } as const;

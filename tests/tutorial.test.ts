import assert from 'node:assert/strict';
import test from 'node:test';
import { TRAINING_RUN } from '../src/data/missions';
import { expeditionOrders, type Technique } from '../src/data/tharsisOrders';
import { activateCrewAbility } from '../src/simulation/crewAbilities';
import { assessMission } from '../src/simulation/missionStatus';
import { advanceSol, continueAfterOutcome, continueAfterReport, createInitialGameState, isTharsis } from '../src/simulation/solEngine';
import { defaultLoad, dispatchRover, type RoverLoad, type TharsisState } from '../src/simulation/tharsis';
import { resolveBriefing } from '../src/simulation/tharsisEvents';
import { activateUpgrade } from '../src/simulation/tharsisUpgrades';
import { acceptWork, assignWork, chooseFieldCrew, findOrder } from '../src/simulation/tharsisWork';
import { BOARD_TOUR_LENGTH, menuStep, runStep, type CoachStep } from '../src/ui/tutorialSteps';

/**
 * A player who does exactly what the tutorial says. It keeps the same few facts the mission screen
 * keeps (open panel, picked row) and turns a click on a button key into the action that button runs
 * in src/ui/tharsisFlight.ts and its panels. Any refused action fails the test: the tutorial must
 * never point at a button that does nothing.
 */
function follower() {
    const state = createInitialGameState(TRAINING_RUN, [], 0) as TharsisState;
    assert.ok(isTharsis(state));
    const run = state.tharsis;
    let panel: string | null = null;
    let selected: string | null = null;
    let resource = 'energy';
    let tour = 0;
    let draft: RoverLoad | null = null;
    const methods = new Map<string, Technique>();
    const seen: string[] = [];
    const ok = (result: string | null, key: string) => assert.equal(result, null, `${key} was refused`);
    const openBay = (bay: string) => {
        panel = bay;
        selected = expeditionOrders(run.expedition).find(order => order.bay === bay)?.id ?? null;
    };
    const endSol = () => {
        assert.equal(advanceSol(state).advanced, true);
        panel = null;
    };

    function step(): CoachStep {
        const status = run.phase === 'planning' ? assessMission(state, draft ?? defaultLoad(state)) : undefined;
        return runStep(state, status, { panel, selected, resource, technique: id => methods.get(id) }, tour);
    }

    function click(current: CoachStep): void {
        seen.push(current.id);
        if (current.next) { tour++; return; }
        const key = current.target;
        assert.ok(key, `step ${current.id} gives nothing to click`);
        assert.ok(!current.showGuide, `the tutorial gave up at ${current.id}`);
        const rest = (prefix: string) => key.slice(prefix.length);
        if (key.startsWith('choice-')) ok(resolveBriefing(state, Number(rest('choice-'))), key);
        else if (key === 'planning') continueAfterOutcome(state);
        else if (key === 'nextBrief') continueAfterReport(state);
        else if (key.startsWith('check-')) openBay(rest('check-'));
        else if (key.startsWith('tab-')) openBay(rest('tab-'));
        else if (key.startsWith('order-')) selected = rest('order-');
        else if (key === 'method-specialist') methods.set(selected!, 'specialist');
        else if (key === 'schedule') {
            const technique = methods.get(selected!);
            ok(acceptWork(state, findOrder(state, selected!)!, technique ? [technique] : []), key);
            panel = 'assignments';
        } else if (key === 'tasks') { panel = 'assignments'; selected = run.work[0]?.orderId ?? null; }
        else if (key === 'view-scheduled') { panel = 'assignments'; selected = run.work[0]?.orderId ?? null; }
        else if (key.startsWith('lead-')) ok(assignWork(state, selected!, rest('lead-')), key);
        else if (key === 'close') panel = null;
        else if (key.startsWith('crew-')) { panel = 'abilities'; selected = rest('crew-'); }
        else if (key.startsWith('specialty-')) selected = rest('specialty-');
        else if (key === 'activate-specialty') ok(activateCrewAbility(state, 'station', selected!), key);
        else if (key === 'roverChecklist') { panel = 'roverChecklist'; draft ??= defaultLoad(state); }
        else if (key.startsWith('traveler-')) ok(chooseFieldCrew(state, rest('traveler-')), key);
        else if (key === 'resource-oxygen') { panel = 'resources'; resource = 'oxygen'; }
        else if (key === 'resource-detail-oxygen') resource = 'oxygen';
        else if (key === 'resource-system') ok(activateUpgrade(state, { kind: 'electrolysis' }), key);
        else if (key === 'reset-load') draft = defaultLoad(state);
        else if (key === 'dispatch') { ok(dispatchRover(state, draft ?? defaultLoad(state)), key); draft = null; panel = null; }
        else if (key === 'endSol') {
            if (assessMission(state, draft ?? defaultLoad(state)).review) panel = 'solReview';
            else endSol();
        } else if (key === 'review-advance') endSol();
        else assert.fail(`the test player does not know the button "${key}" (step ${current.id})`);
    }

    return { state, step, click, seen, view: () => ({ panel, selected }), set: (next: { panel?: string | null; selected?: string | null }) => {
        if (next.panel !== undefined) panel = next.panel;
        if (next.selected !== undefined) selected = next.selected;
    } };
}

test('the menu tutorial welcomes a new player and leads them to the training launch', () => {
    const fresh = { welcomed: false, trainingReady: false };
    assert.equal(menuStep('menu', fresh)?.next, 'Show me!');
    assert.equal(menuStep('menu', { ...fresh, welcomed: true })?.target, 'play');
    assert.equal(menuStep('mission', fresh)?.target, 'open-training');
    assert.equal(menuStep('cargo', { ...fresh, trainingReady: true })?.target, 'launch');
    assert.equal(menuStep('cargo', fresh), null);
    assert.equal(menuStep('crew', fresh)?.target, 'play');
    assert.equal(menuStep('quit', fresh), null);
});

test('a player who clicks only what the tutorial points at wins the training in six Sols', () => {
    const player = follower();
    let current = player.step();
    for (let clicks = 0; !current.done; clicks++) {
        assert.ok(clicks < 200, `still not finished after 200 clicks: ${player.seen.slice(-8).join(' > ')}`);
        player.click(current);
        current = player.step();
    }
    assert.deepEqual([player.state.result?.outcome, player.state.result?.solReached], ['victory', 6]);
    assert.equal(current.target, 'menu');
    // The station tour comes first and is shown once.
    const firstPlanning = player.seen.indexOf('tour-supplies');
    assert.deepEqual(player.seen.slice(firstPlanning, firstPlanning + BOARD_TOUR_LENGTH), ['tour-supplies', 'tour-crew', 'tour-sol']);
    assert.equal(player.seen.filter(id => id.startsWith('tour-')).length, BOARD_TOUR_LENGTH);
    // Every part of the mission was taught.
    for (const id of ['briefing-1', 'outcome-1', 'double-go', 'job-drive-check-method', 'job-drive-check-schedule', 'job-drive-check-lead',
        'job-sampler-lead', 'job-audit-lead', 'end-sol-1', 'report-2', 'travelers-add-crew_pilot', 'travelers-add-crew_captain',
        'job-suits-lead', 'air-go', 'dispatch-go', 'end-sol-6']) {
        assert.ok(player.seen.includes(id), `the walkthrough never showed "${id}"`);
    }
});

test('every tutorial sentence is short enough for the speech bubble', () => {
    const player = follower();
    let current = player.step();
    const texts = new Set<string>();
    for (let clicks = 0; !current.done && clicks < 200; clicks++) {
        texts.add(current.text);
        player.click(current);
        current = player.step();
    }
    texts.add(current.text);
    for (const text of texts) assert.ok(text.length <= 170, `too long (${text.length}): ${text}`);
});

test('the tutorial recovers when the player wanders off or picks someone else', () => {
    const player = follower();
    const until = (id: string) => {
        let current = player.step();
        for (let clicks = 0; current.id !== id; clicks++) {
            assert.ok(clicks < 200, `never reached ${id}`);
            player.click(current);
            current = player.step();
        }
        return current;
    };
    // An unrelated panel is open: the coach sends the player back to the station first.
    until('job-drive-check-room');
    player.set({ panel: 'log' });
    assert.equal(player.step().target, 'close');
    player.set({ panel: null });

    // The player gives the drivetrain check to someone the tutorial did not suggest.
    until('job-drive-check-lead');
    const { state } = player;
    assert.equal(assignWork(state, 'drive-check', 'crew_engineer'), null);
    assert.notEqual(player.step().id, 'job-drive-check-lead');

    // From here the coach still only points at buttons that work (click() fails on a refused one),
    // until the mission ends or it hands over to the game's own guide.
    let current = player.step();
    let clicks = 0;
    while (!state.result && !current.showGuide) {
        assert.ok(++clicks < 300, `stuck after ${player.seen.slice(-8).join(' > ')}`);
        player.click(current);
        current = player.step();
    }
});

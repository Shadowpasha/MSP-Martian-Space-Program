import assert from 'node:assert/strict';
import test from 'node:test';
import type { MissionSetupInput } from '../src/contracts/gameContract';
import { autoFillCargo, type CargoPlacement } from '../src/data/cargo';
import { buildLaunchSetup, launchProblem, missionOffers, TRAINING_RUN } from '../src/data/missions';
import { expeditionOrders, type Technique } from '../src/data/tharsisOrders';
import { activateCrewAbility } from '../src/simulation/crewAbilities';
import { assessMission } from '../src/simulation/missionStatus';
import { advanceSol, continueAfterOutcome, continueAfterReport, createInitialGameState, isTharsis } from '../src/simulation/solEngine';
import { defaultLoad, dispatchRover, type RoverLoad, type TharsisState } from '../src/simulation/tharsis';
import { resolveBriefing } from '../src/simulation/tharsisEvents';
import { activateUpgrade } from '../src/simulation/tharsisUpgrades';
import { acceptWork, assignWork, chooseFieldCrew, findOrder } from '../src/simulation/tharsisWork';
import { BOARD_TOUR_LENGTH, menuStep, newLessons, PREP_TOUR_LENGTHS, prepStep, runStep, type CoachStep, type LaunchView, type PrepView } from '../src/ui/tutorialSteps';

/**
 * A player who does exactly what the tutorial says. It keeps the same few facts the mission screen
 * keeps (open panel, picked row) and turns a click on a button key into the action that button runs
 * in src/ui/tharsisFlight.ts and its panels. Any refused action fails the test: the tutorial must
 * never point at a button that does nothing.
 */
function follower(setup: MissionSetupInput = TRAINING_RUN) {
    const state = createInitialGameState(setup, [], 0) as TharsisState;
    assert.ok(isTharsis(state));
    const run = state.tharsis;
    let panel: string | null = null;
    let selected: string | null = null;
    let resource = 'energy';
    let tour = 0;
    let draft: RoverLoad | null = null;
    const methods = new Map<string, Technique>();
    const pendingLeads = new Map<string, string>();
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
        return runStep(state, status, { panel, selected, resource, technique: id => methods.get(id), pendingLead: id => pendingLeads.get(id) }, tour);
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
        // Two clicks, as on the screen: the card selects, Lock lead assigns and leaves the job.
        else if (key.startsWith('lead-')) pendingLeads.set(selected!, rest('lead-'));
        else if (key === 'lock-lead') {
            const order = findOrder(state, selected!)!;
            ok(assignWork(state, order.id, pendingLeads.get(order.id)!), key);
            pendingLeads.delete(order.id);
            const unstaffed = run.work.find(job => job.orderId !== order.id && !job.leadId);
            if (unstaffed) selected = unstaffed.orderId;
            else openBay(order.bay);
        }
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

const launchView = (change: Partial<LaunchView> = {}): LaunchView => ({ lessons: newLessons(), missionPopup: false, launching: false, cargo: null, ...change });

test('before training the tutorial goes Play, training, pack the cargo, meet the team, launch', () => {
    const lessons = newLessons();
    const sampler = { id: 'windSampler', name: 'Wind Sampler', tab: 'Mission' };
    const cargo = { needed: sampler, tab: 'Mission', held: false, short: true, ready: false };
    const at = (page: Parameters<typeof menuStep>[0], change: Partial<LaunchView> = {}, welcomed = true) =>
        menuStep(page, { ...launchView({ lessons, ...change }), welcomed });
    assert.equal(at('menu', {}, false)?.next, 'Go!');
    assert.equal(at('menu')?.target, 'play');
    assert.equal(at('mission')?.target, 'open-training');

    // Cargo: one thing to read, pick up the needed item, put it down, Auto Fill, go on.
    assert.deepEqual([at('cargo', { cargo })?.id, at('cargo', { cargo })?.next], ['cargo-tour-bay', 'Next']);
    assert.equal(at('cargo', { cargo: { ...cargo, held: true } })?.id, 'cargo-place');
    lessons.cargoTour = PREP_TOUR_LENGTHS.cargo;
    assert.equal(at('cargo', { cargo })?.target, 'cargo-item-windSampler');
    assert.equal(at('cargo', { cargo: { ...cargo, tab: 'Tools' } })?.target, 'cargo-tab-Mission');
    const packed = { ...cargo, needed: null, ready: true };
    assert.equal(at('cargo', { cargo: packed })?.target, 'cargo-autofill');
    lessons.autoFilled = true;
    // Auto Fill is offered once: a bay that is still short goes on instead of looping.
    assert.equal(at('cargo', { cargo: packed })?.target, 'cargo-launch');
    assert.equal(at('cargo', { cargo: { ...packed, ready: false } })?.target, undefined);
    assert.equal(at('cargo'), null);

    // Launch Summary: meet the team once, then launch.
    assert.deepEqual([at('review')?.id, at('review')?.next], ['review-team', 'Next']);
    lessons.teamSeen = true;
    assert.equal(at('review')?.target, 'review-launch');
    assert.equal(at('review', { launching: true }), null);
    assert.equal(at('crew')?.target, 'play');
    assert.equal(at('quit'), null);
});

test('the training run is packed by the player and can be won with any cargo the lesson allows', () => {
    const training = missionOffers()[0]!;
    assert.equal(training.prepared, 'training');
    const sampler: CargoPlacement = { id: 1, item: 'windSampler', x: 0, y: 0, rotation: 0 };
    const filled = autoFillCargo([sampler], training.setup!.missionGoal.requiredEquipment ?? {}, () => ['food', 'water', 'oxygen']);
    assert.ok(filled.length > 1);
    // Nothing packed falls back to the ready-made cargo; otherwise the packed cargo is what flies.
    for (const [name, placements] of [['nothing packed', []], ['sampler only', [sampler]], ['auto filled', filled]] as const) {
        const setup = buildLaunchSetup(training, [], placements)!;
        assert.equal(launchProblem(setup), null, name);
        assert.equal(setup.crew.length, 4, name);
        assert.equal(setup.cargo.windSampler, 1, name);
        const player = follower(setup);
        let current = player.step();
        for (let clicks = 0; !current.done; clicks++) {
            assert.ok(clicks < 200 && !current.showGuide, `${name}: stuck at ${current.id} after ${player.seen.slice(-6).join(' > ')}`);
            player.click(current);
            current = player.step();
        }
        assert.equal(player.state.result?.outcome, 'victory', name);
        assert.ok(player.state.result!.solReached <= 5, name);
    }
});

test('a player who clicks only what the tutorial points at wins the training in four Sols', () => {
    const player = follower();
    let current = player.step();
    for (let clicks = 0; !current.done; clicks++) {
        assert.ok(clicks < 200, `still not finished after 200 clicks: ${player.seen.slice(-8).join(' > ')}`);
        player.click(current);
        current = player.step();
    }
    assert.deepEqual([player.state.result?.outcome, player.state.result?.solReached], ['victory', 4]);
    // Short enough for a young player: the whole mission is well under a hundred clicks.
    assert.ok(player.seen.length <= 60, `${player.seen.length} clicks`);
    assert.equal(current.target, 'menu');
    // The station tour comes first and is shown once.
    const firstPlanning = player.seen.indexOf('tour-supplies');
    assert.deepEqual(player.seen.slice(firstPlanning, firstPlanning + BOARD_TOUR_LENGTH), ['tour-supplies', 'tour-crew', 'tour-sol']);
    assert.equal(player.seen.filter(id => id.startsWith('tour-')).length, BOARD_TOUR_LENGTH);
    // Every part of the mission was taught.
    for (const id of ['briefing-1', 'outcome-1', 'job-drive-check-method', 'job-drive-check-schedule', 'job-drive-check-lead', 'job-drive-check-lock',
        'job-sampler-lead', 'job-audit-lead', 'end-sol-1', 'report-2', 'travelers-add-crew_pilot', 'travelers-add-crew_captain',
        'dispatch-go', 'end-sol-4']) {
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
    for (const text of texts) assert.ok(text.length <= 90, `too long (${text.length}): ${text}`);
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

// ---- Chapter 2: after the training is won ----

function prepView(change: Partial<PrepView> = {}): PrepView {
    return {
        ...launchView(), crewIds: ['a', 'b', 'c', 'd'], crewSize: 4, selectedCrewId: 'a', freeCrewId: 'e',
        upgrade: { canBuySelected: false, buyableId: 'solar_mppt' }, ...change,
    };
}

test('after training the tutorial visits Upgrade, then sends the player to a real mission', () => {
    const view = prepView();
    assert.equal(prepStep('menu', view)?.id, 'prep-welcome');
    view.lessons.intro = true;
    assert.equal(prepStep('menu', view)?.target, 'nav-upgrade');
    assert.equal(prepStep('crew', view)?.target, 'nav-upgrade');

    // Upgrade: two things to read, pick an upgrade the points can buy, then buy it.
    assert.equal(prepStep('upgrade', view)?.next, 'Next');
    view.lessons.upgradeTour = PREP_TOUR_LENGTHS.upgrade;
    assert.equal(prepStep('upgrade', view)?.target, 'upgrade-node-solar_mppt');
    view.upgrade = { canBuySelected: true, buyableId: 'solar_mppt' };
    assert.equal(prepStep('upgrade', view)?.target, 'upgrade-unlock');
    view.lessons.upgradeDone = true;
    assert.equal(prepStep('upgrade', view)?.target, 'play');
    assert.equal(prepStep('menu', view)?.target, 'play');
    assert.equal(prepStep('settings', view)?.target, 'play');
    assert.equal(prepStep('mission', view)?.target, 'select-mission');
    assert.equal(prepStep('mission', { ...view, missionPopup: true })?.target, 'prepare-cargo');
    assert.equal(prepStep('review', view)?.id, 'review-team');
});

test('the Crew page fills an empty seat and the Upgrade lesson copes with no points', () => {
    const lessons = { ...newLessons(), intro: true, upgradeTour: PREP_TOUR_LENGTHS.upgrade };
    const short = prepView({ lessons, crewIds: ['a', 'b', 'c'], selectedCrewId: 'a', freeCrewId: 'e' });
    assert.equal(prepStep('crew', short)?.target, 'crew-card-e');
    assert.equal(prepStep('crew', { ...short, selectedCrewId: 'e' })?.target, 'crew-add');
    const none = prepStep('upgrade', prepView({ lessons, upgrade: { canBuySelected: false, buyableId: null } }))!;
    assert.deepEqual([none.id, none.target, none.next], ['upgrade-none', undefined, 'Okay!']);
});

test('every sentence on the menu pages is short', () => {
    const cargo = { needed: { id: 'windSampler', name: 'Wind Sampler', tab: 'Mission' }, tab: 'Tools', held: false, short: true, ready: false };
    const texts = new Set<string>();
    const pages = ['menu', 'crew', 'upgrade', 'mission', 'cargo', 'review', 'settings'] as const;
    const variants: Partial<PrepView>[] = [{}, { crewIds: ['a'] }, { crewIds: ['a'], selectedCrewId: 'z' }, { missionPopup: true }, { cargo },
        { cargo: { ...cargo, tab: 'Mission' } }, { cargo: { ...cargo, held: true } }, { cargo: { ...cargo, needed: null } },
        { cargo: { ...cargo, needed: null, short: false, ready: true } }, { upgrade: { canBuySelected: true, buyableId: 'x' } },
        { upgrade: { canBuySelected: false, buyableId: null } }];
    const lessons = newLessons();
    for (let round = 0; round < 4; round++) {
        for (const page of pages) for (const variant of variants) {
            for (const step of [prepStep(page, prepView({ lessons, ...variant })), menuStep(page, { ...launchView({ lessons, ...variant }), welcomed: round > 0 })]) {
                if (step) texts.add(step.text);
            }
        }
        lessons.intro = true;
        lessons.upgradeTour++; lessons.cargoTour++;
        if (round >= 1) { lessons.autoFilled = true; lessons.teamSeen = true; }
        if (round >= 2) lessons.upgradeDone = true;
    }
    assert.ok(texts.size > 20);
    for (const text of texts) assert.ok(text.length <= 70, `too long (${text.length}): ${text}`);
});

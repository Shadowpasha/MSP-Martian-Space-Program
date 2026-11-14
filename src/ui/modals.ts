import {
    ArrayDataSource,
    createButton,
    createDialog,
    createListView,
    createScrollView,
    createTextInput,
    measureText,
    px,
    spawnUIEntity,
    TextAlign,
    TextVerticalAlign,
    UINode,
    uiPlugin,
    UIPointerEvents,
    UIPositionType,
    type ButtonHandle,
    type Color,
    type DialogHandle,
    type Entity,
    type FocusManagerState,
    type ListViewHandle,
    type TextInputHandle,
    type UIEventQueue,
    type World,
} from 'esengine';
import {
    type CrewMember,
    type ResourcePool,
} from '../contracts/gameContract';
import { CARGO_ITEMS } from '../data/cargo';
import { formatResource, resourceEntries } from '../data/missions';
import {
    evaluatePlanOffline,
    generateTaskWithGemini,
    getGeminiStatusLabel,
    preloadGeminiKey,
    type ProposedTaskSpec,
} from '../services/geminiPlanner';
import {
    assignCrewToTask,
    computeTaskEfficiency,
    consumeCargoDirectly,
    enqueueTask,
    getCrewAssignment,
    isChoiceAvailable,
    resolveDailyEventChoice,
    type OutpostGameState,
} from '../simulation/solEngine';
import {
    buttonStates,
    categoryColor,
    lerpColor,
    makeAbsBox,
    makeAbsLabel,
    makeFramedBox,
    PALETTE,
    roleColor,
    setNodeDisplayed,
    setText,
    setTextColor,
    setVisualColor,
    setVisualTexture,
} from './theme';

export interface ChatBubbleMsg {
    id: number;
    sender: 'user' | 'aries';
    text: string;
}

export interface ModalsController {
    openEventModal: () => void;
    openAiModal: (prefillPrompt?: string) => void;
    openCrewModal: (crewId: string) => void;
    openStationModal: (focus: 'sensor' | 'hydro' | 'rover' | 'cargo') => void;
    openEndReportModal: () => void;
    openSolReport: () => void;
    setPortraitTexture: (crewId: string, textureHandle: number) => void;
    setAiRobotTexture: (textureHandle: number) => void;
    tick: (elapsedSec: number) => void;
}

function formatPartialPool(p: Partial<ResourcePool>): string {
    const parts: string[] = [];
    if (p.energy) parts.push(`${p.energy} PWR`);
    if (p.food) parts.push(`${p.food} FOOD`);
    if (p.water) parts.push(`${p.water} H2O`);
    if (p.oxygen) parts.push(`${p.oxygen} O2`);
    if (p.res) parts.push(`${p.res} RES`);
    return parts.length > 0 ? parts.join(', ') : 'None';
}

function centeredPanel(width: number, height: number) {
    return {
        position: UIPositionType.Absolute,
        insetLeft: px((1280 - width) / 2), insetTop: px((720 - height) / 2), width: px(width), height: px(height),
    };
}

export function createGameModals(opts: {
    world: World;
    events: UIEventQueue;
    parent: Entity;
    focus: Pick<FocusManagerState, 'focus' | 'focusVisible'>;
    getState: () => OutpostGameState;
    onStateChanged: () => void;
    onExit: (destination: 'menu' | 'mission' | 'moon') => void;
}): ModalsController {
    const { world, events, parent, focus, getState, onStateChanged, onExit } = opts;

    // -------------------------------------------------------------------------
    // 1. Daily Update & Morning Report Modal (Centered MSP Style)
    // -------------------------------------------------------------------------
    const eventDlg: DialogHandle = createDialog({
        world,
        events,
        parent,
        backdropVisual: { color: PALETTE.scrim },
        panelNode: centeredPanel(700, 500),
        panelVisual: { color: PALETTE.panelBorderLight },
        startHidden: true,
        closeOnBackdrop: false,
        closeOnEscape: false,
    });

    makeAbsBox(world, eventDlg.panelEntity, 2, 2, 696, 496, PALETTE.modalBg, true);
    const evHeaderBand = makeAbsBox(world, eventDlg.panelEntity, 2, 2, 696, 56, PALETTE.bgDark, true);
    const evTopStripe = makeAbsBox(world, eventDlg.panelEntity, 2, 2, 696, 4, PALETTE.amber, true);
    const evBadgeFrame = makeFramedBox(world, evHeaderBand, 18, 15, 134, 28, PALETTE.marsOrange, PALETTE.goldNormal, true, 2);
    const evBadgeBox = evBadgeFrame.inner;
    const evBadgeLbl = makeAbsLabel(world, evBadgeBox, 0, 0, 130, 24, 'DAILY UPDATE', {
        fontSize: 11,
        bold: true,
        color: PALETTE.darkInk,
        align: TextAlign.Center,
    });
    const evSolLbl = makeAbsLabel(world, evHeaderBand, 166, 16, 420, 26, 'SOL 1  |  Clear -58C', {
        fontSize: 13,
        bold: true,
        color: PALETTE.textMuted,
    });
    const evTitleLbl = makeAbsLabel(world, eventDlg.panelEntity, 22, 66, 656, 30, '', {
        fontSize: 20,
        bold: true,
        color: PALETTE.amber,
    });
    const evReportFrame = makeFramedBox(world, eventDlg.panelEntity, 22, 100, 656, 68, PALETTE.panelCard, PALETTE.panelBorder, true, 2);
    const evReportLbl = makeAbsLabel(world, evReportFrame.inner, 10, 4, 632, 56, '', {
        fontSize: 12,
        color: PALETTE.cyan,
        verticalAlign: TextVerticalAlign.Top,
        wordWrap: true,
    });
    const evPromptLbl = makeAbsLabel(world, eventDlg.panelEntity, 22, 176, 656, 48, '', {
        fontSize: 14,
        color: PALETTE.textPrimary,
        verticalAlign: TextVerticalAlign.Top,
        wordWrap: true,
    });

    const evChoiceSlots: Array<{
        root: Entity;
        btn: ButtonHandle;
        title: Entity;
        sub: Entity;
        choiceId: string;
    }> = [];
    for (let i = 0; i < 3; i++) {
        const y = 230 + i * 74;
        const btn = createButton({
            world,
            events,
            parent: eventDlg.panelEntity,
            node: { position: UIPositionType.Absolute, insetLeft: px(22), insetTop: px(y), width: px(656), height: px(64) },
            states: buttonStates(PALETTE.panelBorder, PALETTE.goldNormal, PALETTE.panelBorderLight, PALETTE.btnDisabled),
            fadeDuration: 0.12,
            onClick: () => {
                const slot = evChoiceSlots[i]!;
                if (!slot.choiceId) return;
                const res = resolveDailyEventChoice(getState(), slot.choiceId);
                if (res.ok) {
                    onStateChanged();
                    refreshEventModal();
                    focus.focus(evCloseBtn.entity, focus.focusVisible);
                }
            },
        });
        const cardInner = makeAbsBox(world, btn.entity, 2, 2, 652, 60, PALETTE.panelCard, true);
        makeAbsBox(world, cardInner, 0, 0, 5, 60, i === 0 ? PALETTE.green : i === 1 ? PALETTE.cyan : PALETTE.amber, true);
        const title = makeAbsLabel(world, cardInner, 14, 6, 624, 24, '', {
            fontSize: 14,
            bold: true,
        });
        const sub = makeAbsLabel(world, cardInner, 14, 30, 624, 24, '', {
            fontSize: 12,
            color: PALETTE.green,
            wordWrap: true,
        });
        evChoiceSlots.push({ root: btn.entity, btn, title, sub, choiceId: '' });
    }

    const evCloseBtn = createButton({
        world,
        events,
        parent: eventDlg.panelEntity,
        node: { position: UIPositionType.Absolute, insetLeft: px(480), insetTop: px(448), width: px(198), height: px(40) },
        states: buttonStates(),
        fadeDuration: 0.12,
        onClick: () => {
            if (!getState().currentEvent) eventDlg.close();
        },
    });
    makeAbsLabel(world, evCloseBtn.entity, 0, 0, 198, 40, 'Continue to Planning', { fontSize: 14, bold: true, align: TextAlign.Center });

    function refreshEventModal(): void {
        const st = getState();
        const ev = st.currentEvent;
        setText(world, evSolLbl, `SOL ${st.sol} / ${st.goal.deadlineSol}  |  ${st.conditions.weather} ${st.conditions.temperatureC}C`);
        setText(world, evReportLbl, st.sol === 1 && ev ? st.lastSolReport.join('\n') : `Mission: ${st.goal.title} · Due Sol ${st.goal.deadlineSol}`);
        setNodeDisplayed(world, evCloseBtn.entity, !ev);
        if (!ev) {
            setText(world, evBadgeLbl, 'EVENT OUTCOME');
            setText(world, evTitleLbl, st.lastEventChoiceLabel);
            setText(world, evPromptLbl, st.lastEventOutcome ?? 'All set for today! Issue tasks, drag crew, then tap END SOL.');
            for (const slot of evChoiceSlots) {
                slot.choiceId = '';
                setNodeDisplayed(world, slot.root, false);
            }
            return;
        }
        setText(world, evBadgeLbl, ev.badge);
        setText(world, evTitleLbl, ev.title);
        setText(world, evPromptLbl, ev.prompt);
        for (let i = 0; i < 3; i++) {
            const slot = evChoiceSlots[i]!;
            const c = ev.choices[i];
            setNodeDisplayed(world, slot.root, Boolean(c));
            if (!c) {
                slot.choiceId = '';
                slot.btn.setDisabled(true);
                setText(world, slot.title, 'No other option');
                setText(world, slot.sub, '');
                continue;
            }
            const avail = isChoiceAvailable(st, c);
            slot.choiceId = c.id;
            slot.btn.setDisabled(!avail.ok);
            setText(world, slot.title, avail.ok ? c.label : `${c.label}  [LOCKED: ${avail.reason}]`);
            setTextColor(world, slot.title, avail.ok ? PALETTE.textPrimary : PALETTE.red);
            setText(world, slot.sub, c.summary);
        }
    }

    const solReport = createDialog({
        world, events, parent,
        backdropVisual: { color: PALETTE.scrim },
        panelNode: centeredPanel(760, 520),
        panelVisual: { color: PALETTE.modalBg },
        startHidden: true, closeOnBackdrop: false, closeOnEscape: false,
    });
    const solReportTitle = makeAbsLabel(world, solReport.panelEntity, 24, 20, 712, 36, '', { fontSize: 22, bold: true, color: PALETTE.amber });
    const solReportReserves = makeAbsLabel(world, solReport.panelEntity, 24, 60, 712, 32, '', { fontSize: 13, bold: true, color: PALETTE.cyan });
    const solReportScroll = createScrollView({
        world, host: uiPlugin, parent: solReport.panelEntity,
        node: { position: UIPositionType.Absolute, insetLeft: px(24), insetTop: px(104), width: px(712), height: px(332) },
        viewportSize: { x: 712, y: 332 }, contentSize: { x: 712, y: 332 },
        background: { color: PALETTE.bgDark }, direction: 'vertical',
    });
    const solReportText = makeAbsLabel(world, solReportScroll.content, 12, 12, 676, 332, '', {
        fontSize: 13, verticalAlign: TextVerticalAlign.Top, wordWrap: true,
    });
    const solContinue = createButton({
        world, events, parent: solReport.panelEntity,
        node: { position: UIPositionType.Absolute, insetLeft: px(476), insetTop: px(456), width: px(260), height: px(44) },
        states: buttonStates(PALETTE.goldNormal, PALETTE.goldHover, PALETTE.goldPressed),
        onClick: () => getState().result ? openEndReportModal() : openEventModal(),
    });
    const solContinueLabel = makeAbsLabel(world, solContinue.entity, 0, 0, 260, 44, '', {
        fontSize: 14, bold: true, color: PALETTE.darkInk, align: TextAlign.Center,
    });

    // -------------------------------------------------------------------------
    // 2. A.R.I.E.S. Issue Tasks Modal (Centered MSP 2-Column Style)
    // -------------------------------------------------------------------------
    const aiDlg: DialogHandle = createDialog({
        world,
        events,
        parent,
        backdropVisual: { color: PALETTE.scrim },
        panelNode: centeredPanel(844, 552),
        panelVisual: { color: PALETTE.panelBorderLight },
        startHidden: true,
    });

    makeAbsBox(world, aiDlg.panelEntity, 2, 2, 840, 548, PALETTE.modalBg, true);
    makeAbsBox(world, aiDlg.panelEntity, 2, 2, 840, 58, PALETTE.bgDark, true);
    const aiTopStripe = makeAbsBox(world, aiDlg.panelEntity, 2, 2, 840, 4, PALETTE.cyan, true);
    const aiAvatarFrame = makeFramedBox(world, aiDlg.panelEntity, 18, 11, 44, 44, PALETTE.panelCard, PALETTE.amber, true, 2);
    const aiBotAvatar = aiAvatarFrame.inner;
    makeAbsLabel(world, aiDlg.panelEntity, 72, 11, 420, 24, 'ISSUE TASKS', {
        fontSize: 18,
        bold: true,
        color: PALETTE.amber,
    });
    const aiModeLbl = makeAbsLabel(world, aiDlg.panelEntity, 72, 34, 540, 18, 'Tell A.R.I.E.S. what to do!', {
        fontSize: 11,
        color: PALETTE.textMuted,
    });
    const aiCloseBtn = createButton({
        world,
        events,
        parent: aiDlg.panelEntity,
        node: { position: UIPositionType.Absolute, insetLeft: px(748), insetTop: px(15), width: px(78), height: px(32) },
        states: buttonStates(),
        fadeDuration: 0.12,
        onClick: () => aiDlg.close(),
    });
    makeAbsLabel(world, aiCloseBtn.entity, 0, 0, 78, 32, 'Close', { fontSize: 12, bold: true, align: TextAlign.Center });

    // Chat log via ListView
    const chatMessages = new ArrayDataSource<ChatBubbleMsg>([
        {
            id: 1,
            sender: 'aries',
            text: 'Hi Commander! Tell me a job or tap a quick button below, and I will figure out the cost!',
        },
    ]);
    let chatNextId = 2;
    let pendingProposal: ProposedTaskSpec | null = null;
    let aiBusy = false;

    const CHAT_W = 446;
    const CHAT_H = 332;
    const chatFrame = makeFramedBox(world, aiDlg.panelEntity, 18, 68, CHAT_W, CHAT_H, PALETTE.bgDark, PALETTE.panelBorder, false, 2);
    const chatSlot = chatFrame.inner;
    const chatBubbleMap = new Map<Entity, { box: Entity; label: Entity }>();

    function bubbleSize(msg: ChatBubbleMsg): { w: number; h: number } {
        const maxW = 400;
        const m = measureText(msg.text, { fontSize: 12, maxWidth: maxW - 20 });
        return { w: Math.min(maxW, Math.max(90, Math.ceil(m.width) + 22)), h: Math.max(34, m.height + 16) };
    }

    const chatList: ListViewHandle<ChatBubbleMsg> = createListView<ChatBubbleMsg>({
        host: uiPlugin,
        world,
        parent: chatSlot,
        viewportSize: { x: CHAT_W - 4, y: CHAT_H - 4 },
        background: { color: PALETTE.bgDark },
        data: chatMessages,
        layout: { itemHeight: (idx) => bubbleSize(chatMessages.getItem(idx)).h, spacing: 8 },
        item: {
            create: (w, p) => {
                const row = spawnUIEntity({ world: w, parent: p });
                const box = spawnUIEntity({
                    world: w,
                    parent: row,
                    node: { position: UIPositionType.Absolute, insetLeft: px(8), insetTop: px(0), insetBottom: px(0), width: px(412) },
                    visual: { color: PALETTE.panelCard },
                });
                const label = spawnUIEntity({
                    world: w,
                    parent: box,
                    node: { position: UIPositionType.Absolute, insetLeft: px(10), insetRight: px(10), insetTop: px(6), insetBottom: px(6) },
                    text: { content: '', fontSize: 12, color: PALETTE.textPrimary, align: TextAlign.Left, verticalAlign: TextVerticalAlign.Middle, wordWrap: true },
                });
                chatBubbleMap.set(row, { box, label });
                return row;
            },
            bind: (row, item) => {
                const pair = chatBubbleMap.get(row);
                if (!pair) return;
                const mine = item.sender === 'user';
                setVisualColor(world, pair.box, mine ? { r: 0.19, g: 0.34, b: 0.56, a: 1 } : PALETTE.panelCard);
                setText(world, pair.label, mine ? `YOU: ${item.text}` : `A.R.I.E.S.: ${item.text}`);
            },
        },
    });

    // Quick suggestion chips
    const quickPlans: Array<{ label: string; prompt: string }> = [
        { label: 'Prep Sensor', prompt: 'Prep weather sensor and atmospheric mast' },
        { label: 'Prep Rover', prompt: 'Prep mission rover for rough terrain travel' },
        { label: 'Prep Supplies', prompt: 'Prep mission supplies of food, oxygen, and water' },
        { label: 'Gather Data', prompt: 'Gather weather data for 48 hours at target coords' },
    ];
    for (let i = 0; i < quickPlans.length; i++) {
        const qp = quickPlans[i]!;
        const qBtn = createButton({
            world,
            events,
            parent: aiDlg.panelEntity,
            node: { position: UIPositionType.Absolute, insetLeft: px(18 + i * 113), insetTop: px(412), width: px(107), height: px(32) },
            states: buttonStates(PALETTE.btnNormal, PALETTE.primaryNormal, PALETTE.btnPressed),
            fadeDuration: 0.12,
            onClick: () => {
                aiInput.setValue(qp.prompt);
                void submitAiPlan(qp.prompt, true);
            },
        });
        makeAbsBox(world, qBtn.entity, 0, 0, 107, 2, i === 3 ? PALETTE.amber : PALETTE.cyan, true);
        makeAbsLabel(world, qBtn.entity, 0, 0, 107, 32, qp.label, { fontSize: 11, bold: true, align: TextAlign.Center });
    }

    const aiInput: TextInputHandle = createTextInput({
        world,
        events,
        parent: aiDlg.panelEntity,
        node: { position: UIPositionType.Absolute, insetLeft: px(18), insetTop: px(454), width: px(332), height: px(44) },
        placeholder: 'Type a job (e.g. "fix O2 scrubber")...',
        fontSize: 13,
        color: PALETTE.textPrimary,
        backgroundColor: PALETTE.panelCard,
        placeholderColor: PALETTE.textDim,
        onSubmit: (v) => void submitAiPlan(v),
    });

    const aiSendBtn = createButton({
        world,
        events,
        parent: aiDlg.panelEntity,
        node: { position: UIPositionType.Absolute, insetLeft: px(358), insetTop: px(454), width: px(106), height: px(44) },
        states: buttonStates(PALETTE.goldNormal, PALETTE.goldHover, PALETTE.goldPressed),
        fadeDuration: 0.12,
        onClick: () => void submitAiPlan(aiInput.getValue()),
    });
    const aiSendLbl = makeAbsLabel(world, aiSendBtn.entity, 0, 0, 106, 44, 'Ask AI', {
        fontSize: 13,
        bold: true,
        color: PALETTE.darkInk,
        align: TextAlign.Center,
    });

    // Right column: MSP Framed Task Preview Card
    const propFrame = makeFramedBox(world, aiDlg.panelEntity, 480, 68, 346, 430, PALETTE.panelCard, PALETTE.panelBorder, false, 2);
    const propCard = propFrame.inner;
    makeAbsLabel(world, propCard, 12, 10, 318, 22, 'TASK PREVIEW', {
        fontSize: 12,
        bold: true,
        color: PALETTE.cyan,
    });
    const propCatBox = makeAbsBox(world, propCard, 12, 38, 72, 24, PALETTE.amber, true);
    const propCatLbl = makeAbsLabel(world, propCatBox, 0, 0, 72, 24, 'READY', {
        fontSize: 11,
        bold: true,
        color: PALETTE.darkInk,
        align: TextAlign.Center,
    });
    const propRoleLbl = makeAbsLabel(world, propCard, 94, 38, 236, 24, 'Best Crew: -', { fontSize: 12, bold: true, color: PALETTE.amber });
    const propTitleLbl = makeAbsLabel(world, propCard, 12, 70, 318, 26, 'Pick or type a task!', { fontSize: 15, bold: true });
    const propDescLbl = makeAbsLabel(world, propCard, 12, 98, 318, 48, 'Tap a quick button or tell A.R.I.E.S. what to build or explore.', {
        fontSize: 12,
        color: PALETTE.textMuted,
        verticalAlign: TextVerticalAlign.Top,
        wordWrap: true,
    });
    const propDurLbl = makeAbsLabel(world, propCard, 12, 154, 318, 22, 'Time: -', { fontSize: 13, bold: true, color: PALETTE.amber });
    const propUpfrontLbl = makeAbsLabel(world, propCard, 12, 182, 318, 22, 'Start Cost: -', { fontSize: 12 });
    const propDailyLbl = makeAbsLabel(world, propCard, 12, 210, 318, 40, 'Daily Drain: -', {
        fontSize: 12,
        color: PALETTE.marsOrange,
        verticalAlign: TextVerticalAlign.Top,
        wordWrap: true,
    });
    const propRewardLbl = makeAbsLabel(world, propCard, 12, 256, 318, 44, 'Rewards: -', {
        fontSize: 12,
        color: PALETTE.green,
        verticalAlign: TextVerticalAlign.Top,
        wordWrap: true,
    });
    const propRiskLbl = makeAbsLabel(world, propCard, 12, 308, 318, 40, 'Tip: -', {
        fontSize: 12,
        color: PALETTE.textDim,
        verticalAlign: TextVerticalAlign.Top,
        wordWrap: true,
    });

    const aiAcceptBtn = createButton({
        world,
        events,
        parent: propCard,
        node: { position: UIPositionType.Absolute, insetLeft: px(12), insetTop: px(368), width: px(318), height: px(46) },
        states: buttonStates(PALETTE.goldNormal, PALETTE.goldHover, PALETTE.goldPressed),
        fadeDuration: 0.12,
        disabled: true,
        onClick: () => {
            if (!pendingProposal) return;
            enqueueTask(getState(), pendingProposal, 'ai');
            pendingProposal = null;
            refreshProposalCard();
            aiDlg.close();
            onStateChanged();
        },
    });
    makeAbsLabel(world, aiAcceptBtn.entity, 0, 0, 318, 46, '+ GO! ISSUE TASK', {
        fontSize: 14,
        bold: true,
        color: PALETTE.darkInk,
        align: TextAlign.Center,
    });

    function appendChat(sender: 'user' | 'aries', text: string): void {
        chatMessages.append([{ id: chatNextId++, sender, text }]);
        chatList.scrollToIndex(chatMessages.getCount() - 1);
    }

    function refreshProposalCard(): void {
        setText(world, aiModeLbl, getGeminiStatusLabel());
        if (!pendingProposal) {
            aiAcceptBtn.setDisabled(true);
            setVisualColor(world, propCatBox, PALETTE.btnDisabled);
            setText(world, propCatLbl, 'READY');
            setText(world, propRoleLbl, 'Best Crew: -');
            setText(world, propTitleLbl, 'Pick or type a task!');
            setText(world, propDescLbl, 'Tap a quick button or tell A.R.I.E.S. what you want to do.');
            setText(world, propDurLbl, 'Time: -');
            setText(world, propUpfrontLbl, 'Start Cost: -');
            setText(world, propDailyLbl, 'Daily Drain: -');
            setText(world, propRewardLbl, 'Rewards: -');
            setText(world, propRiskLbl, 'Tip: -');
            return;
        }
        const p = pendingProposal;
        aiAcceptBtn.setDisabled(false);
        setVisualColor(world, propCatBox, categoryColor(p.category));
        setText(world, propCatLbl, p.category);
        setText(world, propRoleLbl, `Best Crew: ${p.recommendedRole.toUpperCase()}`);
        setText(world, propTitleLbl, p.title);
        setText(world, propDescLbl, p.description);
        setText(world, propDurLbl, `Time: ${p.durationSols} Sol${p.durationSols > 1 ? 's' : ''}`);
        setText(world, propUpfrontLbl, `Start Cost: ${formatPartialPool(p.upfrontCost)}`);
        setText(world, propDailyLbl, `Daily Drain: ${formatPartialPool(p.dailyCost)} / Sol`);
        const rewParts: string[] = [];
        if (p.rewardOnComplete.resources) {
            const rp = formatPartialPool(p.rewardOnComplete.resources);
            if (rp !== 'None') rewParts.push(`+${rp}`);
        }
        if (p.rewardOnComplete.moraleDelta) rewParts.push(`Morale ${p.rewardOnComplete.moraleDelta > 0 ? '+' : ''}${p.rewardOnComplete.moraleDelta}`);
        if (p.rewardOnComplete.radiationDelta) rewParts.push(`Rad ${p.rewardOnComplete.radiationDelta}`);
        if (p.rewardOnComplete.goalFlag) rewParts.push('WINS MISSION!');
        setText(world, propRewardLbl, `Rewards: ${rewParts.join(' | ') || 'Base stabilized'}`);
        setText(world, propRiskLbl, `Tip: ${p.riskNote}`);
    }

    async function submitAiPlan(rawText: string, quickPlan = false): Promise<void> {
        const text = rawText.trim();
        if (!text || aiBusy) return;
        aiBusy = true;
        aiSendBtn.setDisabled(true);
        setText(world, aiSendLbl, 'Thinking...');
        appendChat('user', text);
        aiInput.setValue('');

        try {
            const st = getState();
            const context = {
                planet: st.planet, sol: st.sol, targetSol: st.targetSol,
                resources: st.resources, conditions: st.conditions, cargo: st.cargo,
                crew: st.crew, goal: st.goal, skillModifiers: st.skillModifiers,
            };
            const res = quickPlan ? evaluatePlanOffline(text, context) : await generateTaskWithGemini(text, context);

            if (!world.valid(parent)) return;
            pendingProposal = res.task;
            appendChat('aries', res.replyText);
            refreshProposalCard();
        } catch (err) {
            if (!world.valid(parent)) return;
            const msg = err instanceof Error ? err.message : 'Unexpected planner error';
            appendChat('aries', `A.R.I.E.S. error: ${msg}`);
        } finally {
            aiBusy = false;
            if (world.valid(parent)) aiSendBtn.setDisabled(false);
            setText(world, aiSendLbl, 'Ask AI');
        }
    }

    // -------------------------------------------------------------------------
    // 3. Crew Profile & Task Assignment Modal
    // -------------------------------------------------------------------------
    const crewDlg: DialogHandle = createDialog({
        world,
        events,
        parent,
        backdropVisual: { color: PALETTE.scrim },
        panelNode: centeredPanel(580, 490),
        panelVisual: { color: PALETTE.panelBorderLight },
        startHidden: true,
    });
    makeAbsBox(world, crewDlg.panelEntity, 2, 2, 576, 486, PALETTE.modalBg, true);
    let inspectedCrewId = '';
    const crewPortraitMap = new Map<string, number>();

    const crewTopStripe = makeAbsBox(world, crewDlg.panelEntity, 2, 2, 576, 4, PALETTE.cyan, true);
    const crewPortraitFrame = makeFramedBox(world, crewDlg.panelEntity, 20, 20, 96, 96, PALETTE.panelCard, PALETTE.goldNormal, true, 2);
    const crewPortraitBox = crewPortraitFrame.inner;
    const crewNameLbl = makeAbsLabel(world, crewDlg.panelEntity, 130, 20, 340, 28, '', { fontSize: 20, bold: true });
    const crewRoleLbl = makeAbsLabel(world, crewDlg.panelEntity, 130, 50, 340, 20, '', { fontSize: 13, bold: true, color: PALETTE.cyan });
    const crewStatsLbl = makeAbsLabel(world, crewDlg.panelEntity, 130, 74, 420, 22, '', { fontSize: 12, color: PALETTE.textMuted });
    const crewAssignLbl = makeAbsLabel(world, crewDlg.panelEntity, 130, 96, 420, 22, '', { fontSize: 12, color: PALETTE.amber });

    const crewBioLbl = makeAbsLabel(world, crewDlg.panelEntity, 20, 126, 540, 40, '', {
        fontSize: 12,
        color: PALETTE.textMuted,
        wordWrap: true,
    });
    const crewPerkFrame = makeFramedBox(world, crewDlg.panelEntity, 20, 174, 540, 62, PALETTE.panelCard, PALETTE.green, true, 2);
    const crewPerkBox = crewPerkFrame.inner;
    const crewPerkTitleLbl = makeAbsLabel(world, crewPerkBox, 12, 4, 512, 22, '', { fontSize: 13, bold: true, color: PALETTE.green });
    const crewPerkDescLbl = makeAbsLabel(world, crewPerkBox, 12, 26, 512, 30, '', { fontSize: 12, wordWrap: true });

    makeAbsLabel(world, crewDlg.panelEntity, 20, 248, 320, 22, 'ASSIGN TO ACTIVE TASK:', {
        fontSize: 12,
        bold: true,
        color: PALETTE.cyan,
    });
    const crewTaskSlotBtns: Array<{ btn: ButtonHandle; lbl: Entity; taskId: string }> = [];
    for (let i = 0; i < 4; i++) {
        const y = 276 + i * 40;
        const btn = createButton({
            world,
            events,
            parent: crewDlg.panelEntity,
            node: { position: UIPositionType.Absolute, insetLeft: px(20), insetTop: px(y), width: px(540), height: px(34) },
            states: buttonStates(),
            onClick: () => {
                const slot = crewTaskSlotBtns[i]!;
                if (!slot.taskId || !inspectedCrewId) return;
                assignCrewToTask(getState(), inspectedCrewId, slot.taskId);
                refreshCrewModal();
                onStateChanged();
            },
        });
        const lbl = makeAbsLabel(world, btn.entity, 12, 0, 516, 34, '', { fontSize: 12 });
        crewTaskSlotBtns.push({ btn, lbl, taskId: '' });
    }

    const crewRestBtn = createButton({
        world,
        events,
        parent: crewDlg.panelEntity,
        node: { position: UIPositionType.Absolute, insetLeft: px(20), insetTop: px(442), width: px(190), height: px(34) },
        states: buttonStates(),
        onClick: () => {
            if (!inspectedCrewId) return;
            assignCrewToTask(getState(), inspectedCrewId, null);
            refreshCrewModal();
            onStateChanged();
        },
    });
    makeAbsLabel(world, crewRestBtn.entity, 0, 0, 190, 34, 'Unassign (Rest / Recover)', { fontSize: 12, align: TextAlign.Center });

    const crewCloseBtn = createButton({
        world,
        events,
        parent: crewDlg.panelEntity,
        node: { position: UIPositionType.Absolute, insetLeft: px(460), insetTop: px(442), width: px(100), height: px(34) },
        states: buttonStates(),
        onClick: () => crewDlg.close(),
    });
    makeAbsLabel(world, crewCloseBtn.entity, 0, 0, 100, 34, 'Close', { fontSize: 12, align: TextAlign.Center });

    function refreshCrewModal(): void {
        const st = getState();
        const m: CrewMember | undefined = st.crew.find((c) => c.id === inspectedCrewId) ?? st.crew[0];
        if (!m) return;
        inspectedCrewId = m.id;

        const rCol = roleColor(m.role);
        setVisualColor(world, crewTopStripe, rCol);
        const tex = crewPortraitMap.get(m.id);
        if (tex !== undefined) {
            setVisualTexture(world, crewPortraitBox, tex);
            setVisualColor(world, crewPortraitBox, { r: 1, g: 1, b: 1, a: 1 });
        } else {
            setVisualColor(world, crewPortraitBox, rCol);
        }

        setText(world, crewNameLbl, m.name);
        setText(world, crewRoleLbl, `${m.role.toUpperCase()}  •  Trait: ${m.trait}`);
        setTextColor(world, crewRoleLbl, rCol);
        setText(world, crewStatsLbl, `Health: ${m.health}%   |   Stamina: ${m.stamina}%   |   Morale: ${m.morale}%`);
        const cur = getCrewAssignment(st, m.id);
        setText(world, crewAssignLbl, cur ? `Currently Assigned: ${cur.title}` : 'Currently Idle / Resting (+12 Stamina/Sol)');
        setText(world, crewBioLbl, m.bio);
        setText(world, crewPerkTitleLbl, `PERK: ${m.perk.title} [${m.perk.bonusCategory}]`);
        setText(world, crewPerkDescLbl, m.perk.description);

        for (let i = 0; i < crewTaskSlotBtns.length; i++) {
            const slot = crewTaskSlotBtns[i]!;
            const t = st.tasks[i];
            if (!t) {
                slot.taskId = '';
                slot.btn.setDisabled(true);
                setText(world, slot.lbl, 'No active task in this slot');
                continue;
            }
            slot.taskId = t.id;
            slot.btn.setDisabled(false);
            const perkTag = m.perk.bonusCategory === t.category || (t.category === 'GOAL' && m.role === 'pilot')
                ? '  ★ PERK MATCH!'
                : '';
            const assignedHere = t.assignedCrewIds.includes(m.id) ? ' [ASSIGNED]' : '';
            setText(world, slot.lbl, `[${t.category}] ${t.title} (${t.progress}/${t.totalSols} Sols)${perkTag}${assignedHere}`);
        }
    }

    // -------------------------------------------------------------------------
    // 4. Station & Rocket Cargo Inventory Modal
    // -------------------------------------------------------------------------
    const stationDlg: DialogHandle = createDialog({
        world,
        events,
        parent,
        backdropVisual: { color: PALETTE.scrim },
        panelNode: centeredPanel(620, 490),
        panelVisual: { color: PALETTE.panelBorderLight },
        startHidden: true,
    });
    makeAbsBox(world, stationDlg.panelEntity, 2, 2, 616, 486, PALETTE.modalBg, true);
    let currentStationFocus: 'sensor' | 'hydro' | 'rover' | 'cargo' = 'cargo';

    makeAbsBox(world, stationDlg.panelEntity, 2, 2, 616, 4, PALETTE.marsOrange, true);
    const stTitleLbl = makeAbsLabel(world, stationDlg.panelEntity, 20, 16, 460, 28, 'OUTPOST STATIONS & CARGO', {
        fontSize: 18,
        bold: true,
        color: PALETTE.amber,
    });
    const stInfoFrame = makeFramedBox(world, stationDlg.panelEntity, 20, 54, 580, 108, PALETTE.panelCard, PALETTE.panelBorder, true, 2);
    const stInfoBox = stInfoFrame.inner;
    const stInfoLbl = makeAbsLabel(world, stInfoBox, 12, 8, 552, 88, '', {
        fontSize: 13,
        color: PALETTE.textPrimary,
        verticalAlign: TextVerticalAlign.Top,
        wordWrap: true,
    });

    const stQuickAiBtn = createButton({
        world,
        events,
        parent: stationDlg.panelEntity,
        node: { position: UIPositionType.Absolute, insetLeft: px(20), insetTop: px(170), width: px(320), height: px(34) },
        states: buttonStates(PALETTE.goldNormal, PALETTE.goldHover, PALETTE.goldPressed),
        fadeDuration: 0.12,
        onClick: () => {
            stationDlg.close();
            if (currentStationFocus === 'hydro') openAiModal('Grow more food and oxygen');
            else if (currentStationFocus === 'rover') openAiModal('Prep mission rover');
            else openAiModal('Prep weather sensor');
        },
    });
    const stQuickAiLbl = makeAbsLabel(world, stQuickAiBtn.entity, 0, 0, 320, 34, 'Open Issue Tasks', {
        fontSize: 12,
        bold: true,
        color: PALETTE.darkInk,
        align: TextAlign.Center,
    });

    makeAbsLabel(world, stationDlg.panelEntity, 20, 214, 580, 22, 'ROCKET CARGO SUPPLIES (Packed Pre-Launch):', {
        fontSize: 12,
        bold: true,
        color: PALETTE.amber,
    });
    const stFeedbackLbl = makeAbsLabel(world, stationDlg.panelEntity, 20, 444, 440, 32, '', {
        fontSize: 12,
        color: PALETTE.green,
    });

    const cargoSlots: Array<{ btn: ButtonHandle; lbl: Entity }> = [];
    for (let i = 0; i < CARGO_ITEMS.length; i++) {
        const item = CARGO_ITEMS[i]!;
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = 20 + col * 295;
        const y = 240 + row * 49;
        const btn = createButton({
            world,
            events,
            parent: stationDlg.panelEntity,
            node: { position: UIPositionType.Absolute, insetLeft: px(x), insetTop: px(y), width: px(285), height: px(44) },
            states: buttonStates(),
            onClick: () => {
                const res = consumeCargoDirectly(getState(), item.id);
                setText(world, stFeedbackLbl, res.text);
                setTextColor(world, stFeedbackLbl, res.ok ? PALETTE.green : PALETTE.amber);
                refreshStationModal();
                onStateChanged();
            },
        });
        const lbl = makeAbsLabel(world, btn.entity, 10, 2, 265, 40, '', { fontSize: 11, wordWrap: true });
        cargoSlots.push({ btn, lbl });
    }

    const stCloseBtn = createButton({
        world,
        events,
        parent: stationDlg.panelEntity,
        node: { position: UIPositionType.Absolute, insetLeft: px(500), insetTop: px(444), width: px(100), height: px(32) },
        states: buttonStates(),
        onClick: () => stationDlg.close(),
    });
    makeAbsLabel(world, stCloseBtn.entity, 0, 0, 100, 32, 'Close', { fontSize: 12, align: TextAlign.Center });

    function refreshStationModal(): void {
        const st = getState();
        if (currentStationFocus === 'sensor') {
            setText(world, stTitleLbl, 'SENSOR ARRAY & WEATHER TELEMETRY');
            setText(
                world,
                stInfoLbl,
                `Current Sol ${st.sol}: ${st.conditions.weather} (${st.conditions.temperatureC}C), Radiation ${st.conditions.radiation} mSv.\n` +
                    `Tomorrow's Forecast (Sol ${st.sol + 1}): ${st.tomorrowForecast.weather} (${st.tomorrowForecast.temperatureC}C), Radiation Risk: ${st.tomorrowForecast.radiationRisk}.\n` +
                    `Tip: Clean solar panels before Dust Storms hit!`,
            );
            setText(world, stQuickAiLbl, 'Issue Solar / Sensor Task');
        } else if (currentStationFocus === 'hydro') {
            setText(world, stTitleLbl, 'HYDROPONICS & LIFE SUPPORT BAY');
            setText(
                world,
                stInfoLbl,
                'Assign a Botanist to boost Hydroponics and Supplies jobs.\n' +
                    `Current Reserves: Food ${st.resources.food}, Water ${st.resources.water}, Oxygen ${st.resources.oxygen}%.`,
            );
            setText(world, stQuickAiLbl, 'Issue Hydroponics Task');
        } else if (currentStationFocus === 'rover') {
            const reqLines = st.goal.requirements
                .map((r) => `${r.current >= r.target ? '[DONE]' : '[    ]'} ${r.current}/${r.target} ${r.label}`)
                .join('  |  ');
            setText(world, stTitleLbl, 'MISSION BRIEFING & REQUIREMENTS');
            setText(
                world,
                stInfoLbl,
                `${st.goal.description}\n` +
                    `Requirements: ${reqLines}\n` +
                    resourceEntries(st.goal.minimumReserves).map(([key, amount]) => formatResource(key, amount)).join(' · '),
            );
            setText(world, stQuickAiLbl, 'Issue Mission / Rover Task');
        } else {
            setText(world, stTitleLbl, 'ROCKET CARGO & RESOURCE MONITOR');
            setText(
                world,
                stInfoLbl,
                'Use the supplies packed before launch.\n' +
                    `Spending supplies here tops up reserves and adds +1 toward Prep Supplies.`,
            );
            setText(world, stQuickAiLbl, 'Open Issue Tasks');
        }

        for (let i = 0; i < CARGO_ITEMS.length; i++) {
            const item = CARGO_ITEMS[i]!;
            const qty = st.cargo[item.id];
            const slot = cargoSlots[i]!;
            slot.btn.setDisabled(qty <= 0 || item.id === 'windSampler' || st.phase !== 'planning');
            setText(world, slot.lbl, `${item.name}  [x${qty}]\n${item.effect}`);
        }
    }

    // -------------------------------------------------------------------------
    // 5. Win / Learn End-of-Run Mission Report Modal
    // -------------------------------------------------------------------------
    const endDlg: DialogHandle = createDialog({
        world,
        events,
        parent,
        backdropVisual: { color: PALETTE.scrim },
        panelNode: centeredPanel(680, 520),
        panelVisual: { color: PALETTE.panelBorderLight },
        startHidden: true,
        closeOnBackdrop: false,
        closeOnEscape: false,
    });
    makeAbsBox(world, endDlg.panelEntity, 2, 2, 676, 516, PALETTE.modalBg, true);
    const endBannerStripe = makeAbsBox(world, endDlg.panelEntity, 2, 2, 676, 6, PALETTE.green, true);
    const endTitleLbl = makeAbsLabel(world, endDlg.panelEntity, 24, 18, 632, 34, 'MISSION REPORT', { fontSize: 22, bold: true });
    const endReasonLbl = makeAbsLabel(world, endDlg.panelEntity, 24, 56, 632, 42, '', { fontSize: 14, color: PALETTE.textPrimary, wordWrap: true });
    const endStatsFrame = makeFramedBox(world, endDlg.panelEntity, 24, 108, 632, 100, PALETTE.panelCard, PALETTE.panelBorder, true, 2);
    const endStatsBox = endStatsFrame.inner;
    const endStatsLbl = makeAbsLabel(world, endStatsBox, 12, 8, 604, 80, '', {
        fontSize: 13,
        color: PALETTE.cyan,
        verticalAlign: TextVerticalAlign.Top,
        wordWrap: true,
    });
    makeAbsLabel(world, endDlg.panelEntity, 24, 222, 632, 24, 'TIPS FOR YOUR NEXT LAUNCH:', {
        fontSize: 13,
        bold: true,
        color: PALETTE.amber,
    });
    const endLessonsFrame = makeFramedBox(world, endDlg.panelEntity, 24, 252, 632, 194, PALETTE.panelCard, PALETTE.panelBorder, true, 2);
    const endLessonsBox = endLessonsFrame.inner;
    const endLessonsLbl = makeAbsLabel(world, endLessonsBox, 12, 8, 604, 174, '', {
        fontSize: 13,
        color: PALETTE.textPrimary,
        verticalAlign: TextVerticalAlign.Top,
        wordWrap: true,
    });

    const debriefActions = [['Main Menu', 'menu'], ['New Mission', 'mission'], ['Moon Test', 'moon']] as const;
    debriefActions.forEach(([label, destination], index) => {
        const primary = destination === 'mission';
        const button = createButton({
            world, events, parent: endDlg.panelEntity,
            node: { position: UIPositionType.Absolute, insetLeft: px(24 + index * 212), insetTop: px(462), width: px(200), height: px(42) },
            states: primary ? buttonStates(PALETTE.goldNormal, PALETTE.goldHover, PALETTE.goldPressed) : buttonStates(),
            onClick: () => { endDlg.close(); onExit(destination); },
        });
        makeAbsLabel(world, button.entity, 0, 0, 200, 42, label, {
            fontSize: 14, bold: true, align: TextAlign.Center, color: primary ? PALETTE.darkInk : PALETTE.textPrimary,
        });
    });

    function refreshEndModal(): void {
        const res = getState().result;
        if (!res) return;
        const win = res.outcome === 'victory';
        setVisualColor(world, endBannerStripe, win ? PALETTE.green : PALETTE.red);
        setText(world, endTitleLbl, win ? 'MISSION ACCOMPLISHED!' : 'MISSION FAILED');
        setTextColor(world, endTitleLbl, win ? PALETTE.green : PALETTE.red);
        setText(world, endReasonLbl, res.reason);
        setText(
            world,
            endStatsLbl,
            `Planet: ${res.planet.toUpperCase()}  |  Sols Elapsed: ${res.solReached} / ${res.targetSol}  |  Goal Completed: ${res.goalCompleted ? 'YES' : 'NO'}\n` +
                `Mission Score: ${res.score}  |  Skill Tree Research Points Earned: +${res.researchPointsEarned} RP\n` +
                `Final Reserves -> PWR: ${res.finalResources.energy}, Food: ${res.finalResources.food}, H2O: ${res.finalResources.water}, O2: ${res.finalResources.oxygen}%, Res: ${res.finalResources.res}`,
        );
        setText(world, endLessonsLbl, res.lessons.map((l, idx) => `${idx + 1}. ${l}`).join('\n\n'));
    }

    function closeAll(): void {
        eventDlg.close();
        solReport.close();
        aiDlg.close();
        crewDlg.close();
        stationDlg.close();
        endDlg.close();
    }

    function openAiModal(prefillPrompt?: string): void {
        closeAll();
        refreshProposalCard();
        void preloadGeminiKey().then((ready) => {
            if (ready && world.valid(parent) && aiDlg.isOpen()) refreshProposalCard();
        });
        if (prefillPrompt) aiInput.setValue(prefillPrompt);
        aiDlg.open();
    }

    function openEventModal(): void {
        closeAll();
        refreshEventModal();
        eventDlg.open();
        const event = getState().currentEvent;
        const first = event?.choices.findIndex(choice => isChoiceAvailable(getState(), choice).ok) ?? -1;
        focus.focus(first >= 0 ? evChoiceSlots[first]!.btn.entity : evCloseBtn.entity, focus.focusVisible);
    }

    function openEndReportModal(): void {
        closeAll();
        refreshEndModal();
        endDlg.open();
    }

    function openSolReport(): void {
        closeAll();
        const state = getState();
        const lastSol = state.timeline[state.timeline.length - 1];
        const reserves = resourceEntries(state.resources).map(([key, amount]) => formatResource(key, amount));
        setText(world, solReportTitle, `Sol ${lastSol?.sol ?? state.sol} Report`);
        setText(world, solReportReserves, [...reserves, `Morale ${state.conditions.morale}%`].join('  ·  '));
        const report = state.lastSolReport.join('\n\n');
        const height = Math.max(308, Math.ceil(measureText(report, { fontSize: 13, maxWidth: 676 }).height) + 16);
        world.update(solReportText, UINode, node => { node.height = px(height); });
        solReportScroll.setContentSize({ x: 712, y: height + 24 });
        solReportScroll.scrollTo({ x: 0, y: 0 });
        setText(world, solReportText, report);
        setText(world, solContinueLabel, state.result ? 'Open Mission Debrief' : 'Next Sol Briefing');
        solReport.open();
        focus.focus(solContinue.entity, focus.focusVisible);
    }

    return {
        openEventModal,
        openAiModal,
        openCrewModal: (crewId: string) => {
            closeAll();
            inspectedCrewId = crewId;
            refreshCrewModal();
            crewDlg.open();
        },
        openStationModal: (focus) => {
            closeAll();
            currentStationFocus = focus;
            setText(world, stFeedbackLbl, '');
            refreshStationModal();
            stationDlg.open();
        },
        openEndReportModal,
        openSolReport,
        setPortraitTexture: (crewId, tex) => {
            crewPortraitMap.set(crewId, tex);
        },
        setAiRobotTexture: (tex) => {
            setVisualTexture(world, aiBotAvatar, tex);
            setVisualColor(world, aiBotAvatar, { r: 1, g: 1, b: 1, a: 1 });
        },
        tick: (elapsedSec) => {
            const pulse = 0.5 + 0.5 * Math.sin(elapsedSec * 4.2);
            if (eventDlg.isOpen()) {
                const st = getState();
                if (st.currentEvent) {
                    const c = lerpColor(PALETTE.marsOrange, PALETTE.goldNormal, pulse);
                    setVisualColor(world, evBadgeBox, c);
                    setVisualColor(world, evTopStripe, c);
                } else {
                    setVisualColor(world, evBadgeBox, PALETTE.green);
                    setVisualColor(world, evTopStripe, PALETTE.green);
                }
            }
            if (aiDlg.isOpen()) {
                if (aiBusy) {
                    const dots = '.'.repeat(1 + (Math.floor(elapsedSec * 3) % 3));
                    setText(world, aiSendLbl, `Wait${dots}`);
                    setVisualColor(world, aiTopStripe, lerpColor(PALETTE.cyan, PALETTE.amber, pulse));
                } else {
                    setVisualColor(world, aiTopStripe, lerpColor(PALETTE.cyan, PALETTE.purple, 0.35 * pulse));
                }
            }
            if (endDlg.isOpen()) {
                const win = getState().result?.outcome === 'victory';
                setVisualColor(
                    world,
                    endBannerStripe,
                    win ? lerpColor(PALETTE.green, PALETTE.goldNormal, pulse) : lerpColor(PALETTE.red, PALETTE.marsOrange, pulse),
                );
            }
        },
    };
}

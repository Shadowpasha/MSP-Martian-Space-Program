import {
    ArrayDataSource,
    Assets,
    createButton,
    createListView,
    createProgress,
    createScrollView,
    defineSystem,
    Draggable,
    GetWorld,
    measureText,
    px,
    Res,
    spawnUIEntity,
    Storage,
    TextAlign,
    TextVerticalAlign,
    UIEvents,
    UINode,
    uiNodeWorldBox,
    uiPlugin,
    UIPositionType,
    type ButtonHandle,
    type Color,
    type Dimension,
    type Entity,
    type ListViewHandle,
    type ProgressHandle,
    type ScrollViewHandle,
    type UIEventQueue,
    type World,
} from 'esengine';
import {
    DEFAULT_MARS_SETUP,
    STORAGE_KEYS,
    type CrewMember,
    type CrewRole,
    type MissionSetupInput,
} from '../contracts/gameContract';
import {
    advanceSol,
    assignCrewToTask,
    cancelTask,
    computeTaskEfficiency,
    createInitialGameState,
    getCrewAssignment,
    setRationPolicy,
    type ActiveTask,
    type LogEntry,
    type OutpostGameState,
} from '../simulation/solEngine';
import { createGameModals, type ModalsController } from '../ui/modals';
import {
    buttonStates,
    categoryColor,
    lerpColor,
    makeAbsBox,
    makeAbsLabel,
    makeFramedBox,
    PALETTE,
    roleColor,
    roleShortTag,
    setNodeDisplayed,
    setText,
    setTextColor,
    setVisualColor,
    setVisualTexture,
} from '../ui/theme';

const MAX_TASK_SLOTS = 8;
const TASK_CARD_H = 114;
const TASK_GAP = 8;

interface TaskSlotUI {
    root: Entity;
    catBox: Entity;
    catLbl: Entity;
    titleLbl: Entity;
    cancelBtn: ButtonHandle;
    metaLbl: Entity;
    costLbl: Entity;
    perkLbl: Entity;
    slotBtns: Array<{ btn: ButtonHandle; lbl: Entity }>;
    taskId: string;
}

interface CrewCardUI {
    id: string;
    role: CrewRole;
    homeX: number;
    homeY: number;
    btn: ButtonHandle;
    inner: Entity;
    stripe: Entity;
    portraitBox: Entity;
    nameLbl: Entity;
    roleLbl: Entity;
    statsLbl: Entity;
    taskLbl: Entity;
}

interface DraggableNodeBox {
    position: number;
    insetLeft: Dimension;
    insetTop: Dimension;
}

let initialized = false;
let updateTick: (() => void) | null = null;

export const gameUiSystem = defineSystem(
    [GetWorld(), Res(UIEvents), Res(Assets)],
    (world: World, events: UIEventQueue, assets) => {
        if (initialized) {
            updateTick?.();
            return;
        }
        const gameRoot = world.findEntityByName('GameRoot');
        if (gameRoot === null) return;
        initialized = true;

        const savedSetup = Storage.getJSON<MissionSetupInput>(STORAGE_KEYS.PENDING_SETUP);
        const savedSkills = Storage.getJSON<string[]>(STORAGE_KEYS.ACTIVE_SKILLS) ?? [];
        let state: OutpostGameState = createInitialGameState(savedSetup ?? DEFAULT_MARS_SETUP, savedSkills);

        // ---------------------------------------------------------------------
        // TOP BAR (0..1280, height 68)
        // ---------------------------------------------------------------------
        const topBar = makeAbsBox(world, gameRoot, 0, 0, 1280, 68, PALETTE.bgDark);
        makeAbsBox(world, topBar, 0, 66, 1280, 2, PALETTE.panelBorder, true);

        interface ResourceChip {
            key: 'energy' | 'food' | 'water' | 'oxygen' | 'res';
            label: string;
            max: number;
            suffix: string;
            color: Color;
            frame: Entity;
            valLbl: Entity;
            bar?: ProgressHandle;
        }

        const resSpecs: Array<{
            key: ResourceChip['key'];
            label: string;
            max: number;
            suffix: string;
            color: Color;
        }> = [
            { key: 'energy', label: 'ENERGY', max: 100, suffix: '', color: PALETTE.amber },
            { key: 'food', label: 'FOOD', max: 60, suffix: '', color: PALETTE.green },
            { key: 'water', label: 'WATER', max: 60, suffix: '', color: PALETTE.cyan },
            { key: 'oxygen', label: 'OXYGEN', max: 100, suffix: '%', color: { r: 0.42, g: 0.85, b: 1, a: 1 } },
            { key: 'res', label: 'RES', max: 40, suffix: '', color: PALETTE.purple },
        ];

        const resChips: ResourceChip[] = [];
        for (let i = 0; i < resSpecs.length; i++) {
            const sp = resSpecs[i]!;
            const x = 10 + i * 108;
            const framed = makeFramedBox(world, topBar, x, 8, 102, 52, PALETTE.panelCard, PALETTE.panelBorder, true, 2);
            makeAbsBox(world, framed.inner, 0, 0, 98, 3, sp.color, true);
            makeAbsLabel(world, framed.inner, 6, 5, 86, 15, sp.label, { fontSize: 10, bold: true, color: PALETTE.textMuted });
            const valLbl = makeAbsLabel(world, framed.inner, 6, 20, 86, 20, '0', { fontSize: 15, bold: true });
            const bar = createProgress({
                world,
                parent: framed.inner,
                node: { position: UIPositionType.Absolute, insetLeft: px(6), insetTop: px(40), width: px(86), height: px(5) },
                background: { color: PALETTE.bgDark },
                fill: { color: sp.color },
                value: 0.5,
            });
            resChips.push({ ...sp, frame: framed.frame, valLbl, bar });
        }

        // Center Sol & Goal indicator
        const solFramed = makeFramedBox(world, topBar, 554, 6, 250, 56, PALETTE.panelCard, PALETTE.panelBorderLight, true, 2);
        const solMainLbl = makeAbsLabel(world, solFramed.inner, 6, 4, 234, 24, 'SOL 1 / 15  |  Clear -58C', {
            fontSize: 13,
            bold: true,
            color: PALETTE.amber,
            align: TextAlign.Center,
        });
        const goalTopLbl = makeAbsLabel(world, solFramed.inner, 6, 28, 234, 20, 'GOAL: Weather Data (Due Sol 15)', {
            fontSize: 11,
            color: PALETTE.cyan,
            align: TextAlign.Center,
        });

        // Conditions (Radiation, Morale)
        const radFramed = makeFramedBox(world, topBar, 812, 8, 114, 52, PALETTE.panelCard, PALETTE.panelBorder, true, 2);
        makeAbsLabel(world, radFramed.inner, 6, 5, 98, 15, 'RADIATION', { fontSize: 10, bold: true, color: PALETTE.textMuted });
        const radValLbl = makeAbsLabel(world, radFramed.inner, 6, 22, 98, 22, '14 mSv', { fontSize: 14, bold: true, color: PALETTE.green });

        const morFramed = makeFramedBox(world, topBar, 932, 8, 114, 52, PALETTE.panelCard, PALETTE.panelBorder, true, 2);
        makeAbsLabel(world, morFramed.inner, 6, 5, 98, 15, 'MORALE', { fontSize: 10, bold: true, color: PALETTE.textMuted });
        const morValLbl = makeAbsLabel(world, morFramed.inner, 6, 22, 98, 22, '84%', { fontSize: 14, bold: true, color: PALETTE.green });

        // Top right quick utility buttons (Cargo, Mission)
        const topCargoBtn = createButton({
            world,
            events,
            parent: topBar,
            node: { position: UIPositionType.Absolute, insetLeft: px(1062), insetTop: px(12), width: px(96), height: px(44) },
            states: buttonStates(),
            fadeDuration: 0.12,
            onClick: () => modals.openStationModal('cargo'),
        });
        makeAbsLabel(world, topCargoBtn.entity, 0, 0, 96, 44, 'Cargo', { fontSize: 12, bold: true, align: TextAlign.Center });

        const topMissionBtn = createButton({
            world,
            events,
            parent: topBar,
            node: { position: UIPositionType.Absolute, insetLeft: px(1168), insetTop: px(12), width: px(102), height: px(44) },
            states: buttonStates(PALETTE.goldNormal, PALETTE.goldHover, PALETTE.goldPressed),
            fadeDuration: 0.12,
            onClick: () => modals.openStationModal('rover'),
        });
        makeAbsLabel(world, topMissionBtn.entity, 0, 0, 102, 44, 'Mission', {
            fontSize: 12,
            bold: true,
            color: PALETTE.darkInk,
            align: TextAlign.Center,
        });

        // ---------------------------------------------------------------------
        // LEFT SIDEBAR: ACTIVE TASKS + RATION POLICY (x: 10, y: 78, w: 266, h: 632)
        // ---------------------------------------------------------------------
        const leftFrame = makeFramedBox(world, gameRoot, 10, 78, 266, 632, PALETTE.panelBg, PALETTE.panelBorder, false, 2);
        const leftPanel = leftFrame.inner;
        makeAbsBox(world, leftPanel, 0, 0, 262, 3, PALETTE.cyan, true);
        makeAbsLabel(world, leftPanel, 10, 8, 140, 24, 'ACTIVE TASKS', { fontSize: 14, bold: true, color: PALETTE.amber });

        const addAiTaskBtn = createButton({
            world,
            events,
            parent: leftPanel,
            node: { position: UIPositionType.Absolute, insetLeft: px(152), insetTop: px(7), width: px(100), height: px(28) },
            states: buttonStates(PALETTE.goldNormal, PALETTE.goldHover, PALETTE.goldPressed),
            fadeDuration: 0.12,
            onClick: () => modals.openAiModal(),
        });
        makeAbsLabel(world, addAiTaskBtn.entity, 0, 0, 100, 28, '+ Issue Task', {
            fontSize: 11,
            bold: true,
            color: PALETTE.darkInk,
            align: TextAlign.Center,
        });

        const rationBtn = createButton({
            world,
            events,
            parent: leftPanel,
            node: { position: UIPositionType.Absolute, insetLeft: px(8), insetTop: px(42), width: px(246), height: px(36) },
            states: buttonStates(PALETTE.panelCard, PALETTE.btnHover, PALETTE.btnPressed),
            fadeDuration: 0.12,
            onClick: () => {
                setRationPolicy(state, state.rationPolicy === 'full' ? 'half' : 'full');
                refreshAllUI();
            },
        });
        const rationLbl = makeAbsLabel(world, rationBtn.entity, 8, 0, 230, 36, 'Food: FULL (+1 Morale/Sol)', {
            fontSize: 12,
            bold: true,
            align: TextAlign.Center,
        });

        const taskScroll: ScrollViewHandle = createScrollView({
            host: uiPlugin,
            world,
            parent: leftPanel,
            node: { position: UIPositionType.Absolute, insetLeft: px(6), insetTop: px(86), width: px(250), height: px(534) },
            viewportSize: { x: 250, y: 534 },
            contentSize: { x: 250, y: 534 },
            background: { color: PALETTE.bgDark },
            direction: 'vertical',
        });

        const emptyTasksLbl = makeAbsLabel(
            world,
            taskScroll.content,
            14,
            24,
            222,
            96,
            'No jobs running yet!\nTap ISSUE TASKS in the middle, then drag a crew card here!',
            { fontSize: 12, color: PALETTE.textMuted, align: TextAlign.Center, wordWrap: true },
        );

        const taskSlots: TaskSlotUI[] = [];
        for (let i = 0; i < MAX_TASK_SLOTS; i++) {
            const root = makeAbsBox(world, taskScroll.content, 4, 4 + i * (TASK_CARD_H + TASK_GAP), 232, TASK_CARD_H, PALETTE.panelCard);
            const catBox = makeAbsBox(world, root, 6, 6, 42, 18, PALETTE.amber, true);
            const catLbl = makeAbsLabel(world, catBox, 0, 0, 42, 18, 'ENG', { fontSize: 10, bold: true, align: TextAlign.Center });
            const titleLbl = makeAbsLabel(world, root, 54, 4, 148, 22, '', { fontSize: 12, bold: true });
            const cancelBtn = createButton({
                world,
                events,
                parent: root,
                node: { position: UIPositionType.Absolute, insetLeft: px(206), insetTop: px(4), width: px(22), height: px(22) },
                states: buttonStates({ r: 0.35, g: 0.14, b: 0.16, a: 1 }, PALETTE.red, PALETTE.btnPressed),
                onClick: () => {
                    const slot = taskSlots[i]!;
                    if (!slot.taskId) return;
                    cancelTask(state, slot.taskId);
                    refreshAllUI();
                },
            });
            makeAbsLabel(world, cancelBtn.entity, 0, 0, 22, 22, 'X', { fontSize: 10, bold: true, align: TextAlign.Center });

            const metaLbl = makeAbsLabel(world, root, 6, 30, 134, 20, '', { fontSize: 11, color: PALETTE.amber });
            const costLbl = makeAbsLabel(world, root, 6, 52, 134, 34, '', {
                fontSize: 10,
                color: PALETTE.textMuted,
                verticalAlign: TextVerticalAlign.Top,
                wordWrap: true,
            });
            const perkLbl = makeAbsLabel(world, root, 6, 88, 220, 20, '', { fontSize: 10, color: PALETTE.green });

            // Two crew assignment slots matching the sketch "O O"
            const slotBtns: Array<{ btn: ButtonHandle; lbl: Entity }> = [];
            for (let s = 0; s < 2; s++) {
                const btn = createButton({
                    world,
                    events,
                    parent: root,
                    node: { position: UIPositionType.Absolute, insetLeft: px(142 + s * 44), insetTop: px(34), width: px(40), height: px(44) },
                    states: buttonStates(),
                    onClick: () => {
                        const slot = taskSlots[i]!;
                        const task = state.tasks.find((t) => t.id === slot.taskId);
                        if (!task) return;
                        handleTaskCrewSlotClick(task, s);
                    },
                });
                const lbl = makeAbsLabel(world, btn.entity, 0, 0, 40, 44, '+', { fontSize: 11, bold: true, align: TextAlign.Center });
                slotBtns.push({ btn, lbl });
            }

            setNodeDisplayed(world, root, false);
            taskSlots.push({
                root,
                catBox,
                catLbl,
                titleLbl,
                cancelBtn,
                metaLbl,
                costLbl,
                perkLbl,
                slotBtns,
                taskId: '',
            });
        }

        function handleTaskCrewSlotClick(task: ActiveTask, slotIndex: number): void {
            const currentId = task.assignedCrewIds[slotIndex];
            if (currentId) {
                assignCrewToTask(state, currentId, null);
                refreshAllUI();
                return;
            }
            // Pick best idle crew (preferring matching specialty), else cycle next crew member
            const idle = state.crew.filter((c) => c.health > 0 && !getCrewAssignment(state, c.id));
            const candidates = idle.length > 0 ? idle : state.crew.filter((c) => c.health > 0 && !task.assignedCrewIds.includes(c.id));
            if (candidates.length === 0) return;

            const preferred = candidates.find(
                (c) => c.perk.bonusCategory === task.category || (task.category === 'GOAL' && c.role === 'pilot'),
            );
            const chosen = preferred ?? candidates[0]!;
            assignCrewToTask(state, chosen.id, task.id);
            refreshAllUI();
        }

        // ---------------------------------------------------------------------
        // CENTER STAGE: HOTSPOTS + MIDDLE COMMAND MENU + CREW DECK
        // (x: 286..984, y: 78..710 -> w: 698, h: 632)
        // ---------------------------------------------------------------------
        const centerStage = makeAbsBox(world, gameRoot, 286, 78, 698, 632);

        // Top Station Hotspots (MSP bordered tabs)
        const stationHotspots: Array<{
            label: string;
            sub: string;
            x: number;
            y: number;
            focus: 'rover' | 'hydro' | 'sensor' | 'cargo';
            accent: Color;
        }> = [
            { label: 'ROVER BAY', sub: 'Mission Goal', x: 16, y: 12, focus: 'rover', accent: PALETTE.marsOrange },
            { label: 'PLANTS', sub: 'Food & O2', x: 186, y: 12, focus: 'hydro', accent: PALETTE.green },
            { label: 'SENSORS', sub: 'Weather & Rad', x: 356, y: 12, focus: 'sensor', accent: PALETTE.cyan },
            { label: 'CARGO', sub: 'Supply Box', x: 526, y: 12, focus: 'cargo', accent: PALETTE.amber },
        ];
        for (const hs of stationHotspots) {
            const btn = createButton({
                world,
                events,
                parent: centerStage,
                node: { position: UIPositionType.Absolute, insetLeft: px(hs.x), insetTop: px(hs.y), width: px(156), height: px(52) },
                states: buttonStates(PALETTE.panelBorder, PALETTE.panelBorderLight, PALETTE.btnPressed),
                fadeDuration: 0.12,
                onClick: () => modals.openStationModal(hs.focus),
            });
            const hsInner = makeAbsBox(world, btn.entity, 2, 2, 152, 48, PALETTE.panelCard, true);
            makeAbsBox(world, hsInner, 0, 0, 152, 3, hs.accent, true);
            makeAbsLabel(world, hsInner, 6, 6, 140, 20, hs.label, { fontSize: 12, bold: true, align: TextAlign.Center });
            makeAbsLabel(world, hsInner, 6, 26, 140, 16, hs.sub, { fontSize: 10, color: PALETTE.textMuted, align: TextAlign.Center });
        }

        // MIDDLE OF SCREEN: STATION COMMAND MENU (Daily Update + Issue Tasks)
        const cmdHubFrame = makeFramedBox(world, centerStage, 48, 122, 602, 202, PALETTE.modalBg, PALETTE.panelBorderLight, false, 2);
        const cmdHubHeader = makeAbsBox(world, cmdHubFrame.inner, 0, 0, 598, 34, PALETTE.bgDark, true);
        const cmdScanBar = makeAbsBox(world, cmdHubHeader, 0, 31, 598, 3, PALETTE.cyan, true);
        const cmdLedColors = [PALETTE.green, PALETTE.cyan, PALETTE.amber, PALETTE.marsOrange];
        const cmdLeds: Entity[] = [];
        for (let i = 0; i < 4; i++) {
            cmdLeds.push(makeAbsBox(world, cmdHubHeader, 12 + i * 14, 12, 8, 8, cmdLedColors[i]!, true));
        }
        makeAbsLabel(world, cmdHubHeader, 76, 5, 450, 24, 'COMMAND MENU - PICK YOUR NEXT MOVE!', {
            fontSize: 13,
            bold: true,
            color: PALETTE.amber,
        });

        // Left Middle Card: DAILY UPDATE
        const dailyCardBtn = createButton({
            world,
            events,
            parent: cmdHubFrame.inner,
            node: { position: UIPositionType.Absolute, insetLeft: px(16), insetTop: px(46), width: px(276), height: px(138) },
            states: buttonStates(PALETTE.marsOrange, PALETTE.goldNormal, PALETTE.btnPressed),
            fadeDuration: 0.12,
            onClick: () => modals.openEventModal(),
        });
        const dailyCardInner = makeAbsBox(world, dailyCardBtn.entity, 2, 2, 272, 134, PALETTE.panelCard, true);
        const dailyPill = makeAbsBox(world, dailyCardInner, 14, 10, 130, 24, PALETTE.marsOrange, true);
        const dailyPillLbl = makeAbsLabel(world, dailyPill, 0, 0, 130, 24, '! NEW UPDATE', {
            fontSize: 11,
            bold: true,
            color: PALETTE.darkInk,
            align: TextAlign.Center,
        });
        const dailyTitleLbl = makeAbsLabel(world, dailyCardInner, 14, 42, 244, 46, 'Landing Checkup!', {
            fontSize: 15,
            bold: true,
            color: PALETTE.textPrimary,
            verticalAlign: TextVerticalAlign.Top,
            wordWrap: true,
        });
        const dailyCtaBox = makeAbsBox(world, dailyCardInner, 14, 94, 244, 28, PALETTE.goldNormal, true);
        const dailyCtaLbl = makeAbsLabel(world, dailyCtaBox, 0, 0, 244, 28, 'OPEN DAILY UPDATE', {
            fontSize: 12,
            bold: true,
            color: PALETTE.darkInk,
            align: TextAlign.Center,
        });

        // Right Middle Card: ISSUE TASKS
        const aiConsoleBtn = createButton({
            world,
            events,
            parent: cmdHubFrame.inner,
            node: { position: UIPositionType.Absolute, insetLeft: px(306), insetTop: px(46), width: px(276), height: px(138) },
            states: buttonStates(PALETTE.cyan, PALETTE.goldNormal, PALETTE.btnPressed),
            fadeDuration: 0.12,
            onClick: () => modals.openAiModal(),
        });
        const aiCardInner = makeAbsBox(world, aiConsoleBtn.entity, 2, 2, 272, 134, PALETTE.panelCard, true);
        const aiAvatarFrame = makeFramedBox(world, aiCardInner, 12, 12, 68, 68, PALETTE.bgDark, PALETTE.cyan, true, 2);
        const aiConsoleIcon = aiAvatarFrame.inner;
        makeAbsLabel(world, aiCardInner, 88, 12, 174, 24, 'ISSUE TASKS', {
            fontSize: 16,
            bold: true,
            color: PALETTE.cyan,
        });
        const aiConsoleSubLbl = makeAbsLabel(
            world,
            aiCardInner,
            88,
            38,
            174,
            46,
            'Ask A.R.I.E.S. AI to make a crew job!',
            { fontSize: 12, color: PALETTE.textMuted, verticalAlign: TextVerticalAlign.Top, wordWrap: true },
        );
        const aiCtaBox = makeAbsBox(world, aiCardInner, 14, 94, 244, 28, PALETTE.goldNormal, true);
        makeAbsLabel(world, aiCtaBox, 0, 0, 244, 28, 'ASK A.R.I.E.S. AI', {
            fontSize: 12,
            bold: true,
            color: PALETTE.darkInk,
            align: TextAlign.Center,
        });

        makeAbsLabel(world, centerStage, 48, 602, 602, 22, 'Drag any crew card below onto an active task on the left, or click a crew card to inspect perks!', {
            fontSize: 11,
            bold: true,
            color: PALETTE.textMuted,
            align: TextAlign.Center,
        });

        // ---------------------------------------------------------------------
        // RIGHT SIDEBAR: OUTPOST STATUS + DAILY LOG + END SOL BUTTON
        // (x: 994, y: 78, w: 276)
        // ---------------------------------------------------------------------
        const rightFrame = makeFramedBox(world, gameRoot, 994, 78, 276, 554, PALETTE.panelBg, PALETTE.panelBorder, false, 2);
        const rightPanel = rightFrame.inner;
        makeAbsBox(world, rightPanel, 0, 0, 272, 3, PALETTE.marsOrange, true);
        makeAbsLabel(world, rightPanel, 10, 8, 252, 22, 'OUTPOST STATUS', { fontSize: 14, bold: true, color: PALETTE.marsOrange });

        const statusBox = makeAbsBox(world, rightPanel, 10, 38, 256, 184, PALETTE.panelCard, true);
        const statusGoalLbl = makeAbsLabel(world, statusBox, 10, 6, 236, 42, '', {
            fontSize: 11,
            bold: true,
            color: PALETTE.cyan,
            wordWrap: true,
        });
        const statusReqsLbl = makeAbsLabel(world, statusBox, 10, 50, 236, 92, '', {
            fontSize: 10,
            color: PALETTE.amber,
            wordWrap: true,
        });
        const statusForecastLbl = makeAbsLabel(world, statusBox, 10, 144, 236, 34, '', {
            fontSize: 10,
            color: PALETTE.textPrimary,
            wordWrap: true,
        });

        makeAbsLabel(world, rightPanel, 12, 228, 252, 20, 'DAILY LOG', { fontSize: 12, bold: true, color: PALETTE.textMuted });

        const logData = new ArrayDataSource<LogEntry>([]);
        const logSlot = makeAbsBox(world, rightPanel, 10, 252, 256, 292, PALETTE.bgDark);
        const logLabelMap = new Map<Entity, Entity>();
        const logList: ListViewHandle<LogEntry> = createListView<LogEntry>({
            host: uiPlugin,
            world,
            parent: logSlot,
            viewportSize: { x: 256, y: 292 },
            background: { color: PALETTE.bgDark },
            data: logData,
            layout: {
                itemHeight: (idx) => {
                    const item = logData.getItem(idx);
                    const m = measureText(item.text, { fontSize: 11, maxWidth: 224 });
                    return Math.max(24, m.height + 10);
                },
                spacing: 4,
            },
            item: {
                create: (w, p) => {
                    const row = spawnUIEntity({ world: w, parent: p });
                    const lbl = spawnUIEntity({
                        world: w,
                        parent: row,
                        node: { position: UIPositionType.Absolute, insetLeft: px(8), insetRight: px(16), insetTop: px(3), insetBottom: px(3) },
                        text: {
                            content: '',
                            fontSize: 11,
                            color: PALETTE.textPrimary,
                            align: TextAlign.Left,
                            verticalAlign: TextVerticalAlign.Middle,
                            wordWrap: true,
                        },
                    });
                    logLabelMap.set(row, lbl);
                    return row;
                },
                bind: (row, item) => {
                    const lbl = logLabelMap.get(row);
                    if (!lbl) return;
                    setText(world, lbl, item.text);
                    const col =
                        item.kind === 'good'
                            ? PALETTE.green
                            : item.kind === 'warn'
                                ? PALETTE.red
                                : item.kind === 'event'
                                    ? PALETTE.amber
                                    : PALETTE.textMuted;
                    setTextColor(world, lbl, col);
                },
            },
        });

        // Bottom Right "END SOL ▷" button
        const endSolBtn = createButton({
            world,
            events,
            parent: gameRoot,
            node: { position: UIPositionType.Absolute, insetLeft: px(994), insetTop: px(642), width: px(276), height: px(68) },
            states: buttonStates(PALETTE.goNormal, PALETTE.goHover, PALETTE.goPressed),
            fadeDuration: 0.12,
            onClick: () => {
                if (state.result !== null) {
                    modals.openEndReportModal();
                    return;
                }
                if (state.currentEvent) {
                    modals.openEventModal();
                    return;
                }
                advanceSol(state);
                refreshAllUI();
                if (state.result !== null) {
                    Storage.setJSON(STORAGE_KEYS.LAST_RESULT, state.result);
                    modals.openEndReportModal();
                } else if (state.currentEvent) {
                    modals.openEventModal();
                }
            },
        });
        const endSolLbl = makeAbsLabel(world, endSolBtn.entity, 12, 8, 252, 32, 'END SOL  ▷', {
            fontSize: 18,
            bold: true,
            color: PALETTE.darkInk,
            align: TextAlign.Center,
        });
        const endSolSubLbl = makeAbsLabel(world, endSolBtn.entity, 12, 40, 252, 20, 'Start next day on Mars', {
            fontSize: 11,
            bold: true,
            color: PALETTE.darkInk,
            align: TextAlign.Center,
        });

        // ---------------------------------------------------------------------
        // DRAGGABLE CREW MEMBER CARDS (neatly spaced across lower center deck)
        // ---------------------------------------------------------------------
        const activeDraggingIds = new Set<string>();
        const suppressClickFrames = new Map<string, number>();
        const crewCards: CrewCardUI[] = [];

        for (let i = 0; i < state.crew.length; i++) {
            const m = state.crew[i]!;
            const homeX = 304 + i * 170;
            const homeY = 446;
            const rCol = roleColor(m.role);

            const btn = createButton({
                world,
                events,
                parent: gameRoot,
                node: { position: UIPositionType.Absolute, insetLeft: px(homeX), insetTop: px(homeY), width: px(146), height: px(154) },
                states: buttonStates(PALETTE.panelBorder, PALETTE.goldNormal, PALETTE.btnPressed),
                fadeDuration: 0.12,
                onClick: () => {
                    if (activeDraggingIds.has(m.id) || (suppressClickFrames.get(m.id) ?? 0) > 0) return;
                    modals.openCrewModal(m.id);
                },
            });
            world.insert(btn.entity, Draggable, {
                enabled: true,
                dragThreshold: 6,
                lockX: false,
                lockY: false,
                constrainMin: false,
                constraintMin: { x: 0, y: 0 },
                constrainMax: false,
                constraintMax: { x: 0, y: 0 },
            });

            const inner = makeAbsBox(world, btn.entity, 2, 2, 142, 150, PALETTE.panelCard, true);
            const stripe = makeAbsBox(world, inner, 0, 0, 142, 4, rCol, true);
            const portraitFrame = makeFramedBox(world, inner, 35, 10, 72, 72, PALETTE.bgDark, rCol, true, 2);
            const portraitBox = portraitFrame.inner;
            const nameLbl = makeAbsLabel(world, inner, 6, 86, 130, 18, m.name.split(' ')[0]!, {
                fontSize: 13,
                bold: true,
                align: TextAlign.Center,
            });
            const roleLbl = makeAbsLabel(world, inner, 6, 104, 130, 15, m.role.toUpperCase(), {
                fontSize: 10,
                bold: true,
                color: rCol,
                align: TextAlign.Center,
            });
            const statsLbl = makeAbsLabel(world, inner, 6, 119, 130, 14, 'HP 96  STA 92', {
                fontSize: 9,
                color: PALETTE.textMuted,
                align: TextAlign.Center,
            });
            const taskLbl = makeAbsLabel(world, inner, 6, 133, 130, 16, 'Drag -> Task', {
                fontSize: 10,
                bold: true,
                color: PALETTE.amber,
                align: TextAlign.Center,
            });

            crewCards.push({ id: m.id, role: m.role, homeX, homeY, btn, inner, stripe, portraitBox, nameLbl, roleLbl, statsLbl, taskLbl });
        }

        function findDropTaskSlot(cardEntity: Entity): TaskSlotUI | null {
            const cardBox = uiNodeWorldBox(world, cardEntity);
            if (!cardBox) return null;
            let best: TaskSlotUI | null = null;
            let bestDist = Infinity;
            for (const slot of taskSlots) {
                if (!slot.taskId) continue;
                const slotBox = uiNodeWorldBox(world, slot.root);
                if (!slotBox) continue;
                const overlapX = Math.abs(cardBox.cx - slotBox.cx) <= slotBox.hw + cardBox.hw * 0.5;
                const overlapY = Math.abs(cardBox.cy - slotBox.cy) <= slotBox.hh + 14;
                if (overlapX && overlapY) {
                    const dist = Math.abs(cardBox.cy - slotBox.cy);
                    if (dist < bestDist) {
                        bestDist = dist;
                        best = slot;
                    }
                }
            }
            return best;
        }

        function resetCardPosition(card: CrewCardUI): void {
            if (!world.has(card.btn.entity, UINode)) return;
            const node = world.get(card.btn.entity, UINode) as unknown as DraggableNodeBox;
            node.position = UIPositionType.Absolute;
            node.insetLeft = px(card.homeX);
            node.insetTop = px(card.homeY);
            world.insert(card.btn.entity, UINode, node);
            setVisualColor(world, card.stripe, roleColor(card.role));
        }

        updateTick = () => {
            const t = typeof performance !== 'undefined' ? performance.now() * 0.001 : Date.now() * 0.001;
            const pulseFast = 0.5 + 0.5 * Math.sin(t * 4.5);
            const pulseSlow = 0.5 + 0.5 * Math.sin(t * 2.4);

            // Colorful animated station LEDs & command hub scan bar
            for (let i = 0; i < cmdLeds.length; i++) {
                const wave = 0.5 + 0.5 * Math.sin(t * 3.5 + i * 1.3);
                setVisualColor(world, cmdLeds[i]!, lerpColor(PALETTE.panelBorder, cmdLedColors[i]!, wave));
            }
            setVisualColor(world, cmdScanBar, lerpColor(PALETTE.cyan, PALETTE.amber, pulseSlow));

            // Pulse Daily Update card & gently bob the NEW UPDATE badge while event awaits
            if (state.currentEvent && state.result === null) {
                setVisualColor(world, dailyCardBtn.entity, lerpColor(PALETTE.marsOrange, PALETTE.goldNormal, pulseFast));
                setVisualColor(world, dailyPill, lerpColor(PALETTE.marsOrange, PALETTE.amber, pulseFast));
                if (world.has(dailyPill, UINode)) {
                    world.update(dailyPill, UINode, (n) => {
                        n.insetTop = px(9 + Math.round(Math.sin(t * 5) * 2));
                    });
                }
            } else {
                setVisualColor(world, dailyCardBtn.entity, PALETTE.panelBorder);
                setVisualColor(world, dailyPill, PALETTE.green);
            }

            // Pulse Issue Tasks card smoothly when no jobs are queued yet
            if (state.tasks.length === 0 && state.result === null) {
                setVisualColor(world, aiConsoleBtn.entity, lerpColor(PALETTE.cyan, PALETTE.green, pulseSlow));
            } else {
                setVisualColor(world, aiConsoleBtn.entity, PALETTE.panelBorderLight);
            }

            // Flash low-resource chip frames red <-> amber as an intuitive kid warning
            for (const chip of resChips) {
                const val = Math.round(state.resources[chip.key]);
                const low = chip.key !== 'res' && val <= chip.max * 0.22;
                setVisualColor(
                    world,
                    chip.frame,
                    low ? lerpColor(PALETTE.red, PALETTE.amber, pulseFast) : PALETTE.panelBorder,
                );
            }

            // Highlight END SOL CTA softly once the Daily Update is resolved
            if (!state.currentEvent && state.result === null) {
                setVisualColor(world, endSolBtn.entity, lerpColor(PALETTE.goldNormal, PALETTE.goNormal, pulseSlow * 0.65));
            }

            // Animate open modals
            modals.tick(t);

            for (const [id, frames] of suppressClickFrames.entries()) {
                if (frames <= 1) suppressClickFrames.delete(id);
                else suppressClickFrames.set(id, frames - 1);
            }

            const dragStartSet = new Set(events.query('drag_start').map((e) => e.target));
            const dragEndSet = new Set(events.query('drag_end').map((e) => e.target));

            for (const card of crewCards) {
                if (dragStartSet.has(card.btn.entity)) {
                    activeDraggingIds.add(card.id);
                    suppressClickFrames.set(card.id, 3);
                    setVisualColor(world, card.stripe, PALETTE.cyan);
                }
            }

            // Highlight target task cards while dragging a crew member
            let hoveredSlot: TaskSlotUI | null = null;
            let draggedCrew: CrewMember | undefined;
            for (const id of activeDraggingIds) {
                const draggedCard = crewCards.find((c) => c.id === id);
                if (draggedCard) {
                    draggedCrew = state.crew.find((c) => c.id === id);
                    hoveredSlot = findDropTaskSlot(draggedCard.btn.entity);
                    break;
                }
            }
            for (const slot of taskSlots) {
                if (!slot.taskId) continue;
                const tObj = state.tasks.find((task) => task.id === slot.taskId);
                const perkMatch = draggedCrew && tObj
                    ? draggedCrew.perk.bonusCategory === tObj.category || (tObj.category === 'GOAL' && draggedCrew.role === 'pilot')
                    : false;
                if (hoveredSlot === slot) {
                    setVisualColor(world, slot.root, { r: 0.16, g: 0.40, b: 0.58, a: 1 });
                } else if (perkMatch) {
                    setVisualColor(world, slot.root, lerpColor(PALETTE.panelCard, { r: 0.16, g: 0.42, b: 0.28, a: 1 }, pulseFast));
                } else {
                    setVisualColor(world, slot.root, PALETTE.panelCard);
                }
            }

            // Gentle colorful role glow on assigned crew cards
            for (const card of crewCards) {
                const assigned = getCrewAssignment(state, card.id);
                if (assigned && !activeDraggingIds.has(card.id)) {
                    setVisualColor(world, card.stripe, lerpColor(roleColor(card.role), PALETTE.goldNormal, pulseSlow));
                }
            }

            let changed = false;
            for (const card of crewCards) {
                if (!dragEndSet.has(card.btn.entity)) continue;
                activeDraggingIds.delete(card.id);
                suppressClickFrames.set(card.id, 3);
                const dropSlot = findDropTaskSlot(card.btn.entity);
                if (dropSlot) {
                    assignCrewToTask(state, card.id, dropSlot.taskId);
                    changed = true;
                }
                resetCardPosition(card);
            }

            if (dragEndSet.size > 0) {
                for (const slot of taskSlots) {
                    if (slot.taskId) setVisualColor(world, slot.root, PALETTE.panelCard);
                }
                if (changed) refreshAllUI();
            }
        };

        // ---------------------------------------------------------------------
        // MODALS CONTROLLER
        // ---------------------------------------------------------------------
        const modals: ModalsController = createGameModals({
            world,
            events,
            parent: gameRoot,
            getState: () => state,
            onStateChanged: () => refreshAllUI(),
            onRestartRun: (setup) => {
                state = createInitialGameState(setup, state.unlockedSkillIds);
                refreshAllUI();
                if (state.currentEvent) modals.openEventModal();
            },
        });

        // Load placeholder portraits & AI bot icon asynchronously via Assets
        for (const m of state.crew) {
            void assets.loadTexture(m.portraitPath).then((res) => {
                modals.setPortraitTexture(m.id, res.handle);
                const card = crewCards.find((c) => c.id === m.id);
                if (card) {
                    setVisualTexture(world, card.portraitBox, res.handle);
                    setVisualColor(world, card.portraitBox, { r: 1, g: 1, b: 1, a: 1 });
                }
            }).catch(() => {});
        }
        void assets.loadTexture('assets/textures/ai_robot.png').then((res) => {
            modals.setAiRobotTexture(res.handle);
            setVisualTexture(world, aiConsoleIcon, res.handle);
            setVisualColor(world, aiConsoleIcon, { r: 1, g: 1, b: 1, a: 1 });
        }).catch(() => {});

        // ---------------------------------------------------------------------
        // UI SYNC FUNCTION
        // ---------------------------------------------------------------------
        function refreshAllUI(): void {
            // Top resources
            for (const chip of resChips) {
                const val = Math.round(state.resources[chip.key]);
                setText(world, chip.valLbl, `${val}${chip.suffix}`);
                const low = chip.key === 'res' ? false : val <= chip.max * 0.22;
                setTextColor(world, chip.valLbl, low ? PALETTE.red : PALETTE.textPrimary);
                chip.bar?.setValue(Math.max(0, Math.min(1, val / chip.max)));
            }

            // Center Sol & Goal
            setText(
                world,
                solMainLbl,
                `SOL ${state.sol} / ${state.goal.deadlineSol}  •  ${state.conditions.weather} (${state.conditions.temperatureC}C)`,
            );
            setText(
                world,
                goalTopLbl,
                state.goal.completed
                    ? `MISSION ACCOMPLISHED!`
                    : `GOAL: ${state.goal.title} (Due Sol ${state.goal.deadlineSol})`,
            );
            setTextColor(world, goalTopLbl, state.goal.completed ? PALETTE.green : PALETTE.cyan);

            // Conditions
            setText(world, radValLbl, `${Math.round(state.conditions.radiation)} mSv`);
            setTextColor(
                world,
                radValLbl,
                state.conditions.radiation >= 50 ? PALETTE.red : state.conditions.radiation >= 30 ? PALETTE.amber : PALETTE.green,
            );
            setText(world, morValLbl, `${Math.round(state.conditions.morale)}%`);
            setTextColor(
                world,
                morValLbl,
                state.conditions.morale <= 30 ? PALETTE.red : state.conditions.morale <= 55 ? PALETTE.amber : PALETTE.green,
            );

            // Ration toggle
            if (state.rationPolicy === 'full') {
                setText(world, rationLbl, 'Rations: FULL (+1 Morale / Sol)');
                setTextColor(world, rationLbl, PALETTE.green);
            } else {
                setText(world, rationLbl, 'Rations: HALF (-50% Food, -7 Morale)');
                setTextColor(world, rationLbl, PALETTE.amber);
            }

            // Active Task Queue
            setNodeDisplayed(world, emptyTasksLbl, state.tasks.length === 0);
            for (let i = 0; i < MAX_TASK_SLOTS; i++) {
                const slot = taskSlots[i]!;
                const task = state.tasks[i];
                if (!task) {
                    slot.taskId = '';
                    setNodeDisplayed(world, slot.root, false);
                    continue;
                }
                slot.taskId = task.id;
                setNodeDisplayed(world, slot.root, true);
                setVisualColor(world, slot.catBox, categoryColor(task.category));
                setText(world, slot.catLbl, task.category);
                setText(world, slot.titleLbl, task.title);

                const eff = computeTaskEfficiency(state, task);
                setText(world, slot.metaLbl, `${task.progress}/${task.totalSols} Sols (+${eff.progressPerSol}/Sol)`);
                const costEntries = Object.entries(eff.effectiveDailyCost)
                    .filter(([, v]) => Boolean(v && v > 0))
                    .map(([k, v]) => `-${v} ${k.slice(0, 3).toUpperCase()}`);
                setText(world, slot.costLbl, costEntries.length > 0 ? `Drain: ${costEntries.join(' ')}` : 'Drain: Minimal');
                setText(
                    world,
                    slot.perkLbl,
                    eff.matchedPerkNames.length > 0
                        ? `★ ${eff.matchedPerkNames[0]}`
                        : eff.progressPerSol > 0
                            ? `Rec: ${task.recommendedRole.toUpperCase()}`
                            : 'Drag crew here ->',
                );
                setTextColor(
                    world,
                    slot.perkLbl,
                    eff.matchedPerkNames.length > 0 ? PALETTE.green : eff.progressPerSol > 0 ? PALETTE.textMuted : PALETTE.red,
                );

                for (let s = 0; s < 2; s++) {
                    const crewId = task.assignedCrewIds[s];
                    const member = crewId ? state.crew.find((c) => c.id === crewId) : undefined;
                    const sBtn = slot.slotBtns[s]!;
                    if (member) {
                        setText(world, sBtn.lbl, `${roleShortTag(member.role)}\n${member.name.split(' ')[0]!.slice(0, 4)}`);
                        setTextColor(world, sBtn.lbl, roleColor(member.role));
                    } else {
                        setText(world, sBtn.lbl, '+');
                        setTextColor(world, sBtn.lbl, PALETTE.textMuted);
                    }
                }
            }
            const scrollH = Math.max(534, 16 + state.tasks.length * (TASK_CARD_H + TASK_GAP));
            taskScroll.setContentSize({ x: 250, y: scrollH });

            // Crew Cards in Center Outpost
            for (const card of crewCards) {
                const m = state.crew.find((c) => c.id === card.id);
                if (!m) continue;
                const assigned = getCrewAssignment(state, m.id);
                setText(world, card.statsLbl, `HP ${m.health}  STA ${m.stamina}`);
                setText(
                    world,
                    card.taskLbl,
                    assigned ? `-> ${assigned.title.slice(0, 14)}` : state.tasks.length > 0 ? 'Drag -> Task' : 'Idle (+Stamina)',
                );
                setTextColor(world, card.taskLbl, assigned ? PALETTE.cyan : PALETTE.green);
            }

            // Middle Command Hub: Daily Update + Issue Tasks state
            const isEnded = state.result !== null;
            if (state.currentEvent && !isEnded) {
                setText(world, dailyPillLbl, '! NEW UPDATE');
                setText(world, dailyTitleLbl, state.currentEvent.title);
                setText(world, dailyCtaLbl, 'OPEN DAILY UPDATE');
                setVisualColor(world, dailyCtaBox, PALETTE.goldNormal);
                setText(world, endSolLbl, 'DAILY UPDATE FIRST');
                setText(world, endSolSubLbl, 'Check center Daily Update card');
            } else if (isEnded) {
                setText(world, dailyPillLbl, 'MISSION DONE');
                setText(world, dailyTitleLbl, state.result?.outcome === 'victory' ? 'Great job, Commander!' : 'Run Complete');
                setText(world, dailyCtaLbl, 'VIEW REPORT');
                setVisualColor(world, dailyCtaBox, PALETTE.green);
                setText(world, endSolLbl, 'VIEW REPORT');
                setText(world, endSolSubLbl, state.result?.outcome === 'victory' ? 'You did it! Tap for report' : 'Tap to see mission tips');
            } else {
                const assignedCount = state.crew.filter((c) => getCrewAssignment(state, c.id)).length;
                setText(world, dailyPillLbl, 'ALL CLEAR');
                setText(world, dailyTitleLbl, `Sol ${state.sol} update done!`);
                setText(world, dailyCtaLbl, 'VIEW BRIEFING');
                setVisualColor(world, dailyCtaBox, PALETTE.panelBorderLight);
                setText(world, endSolLbl, 'END SOL  ▷');
                setText(world, endSolSubLbl, `${assignedCount}/${state.crew.length} crew busy`);
            }

            // Issue Tasks card subtitle
            setText(
                world,
                aiConsoleSubLbl,
                state.tasks.length === 0
                    ? 'Ask A.R.I.E.S. AI to make a job for your crew!'
                    : `${state.tasks.length} active job${state.tasks.length > 1 ? 's' : ''}. Add another anytime!`,
            );

            // Right Status Monitor & Daily Log
            setText(
                world,
                statusGoalLbl,
                state.goal.completed
                    ? `OBJECTIVE COMPLETE: ${state.goal.title}`
                    : `${state.goal.title} (Sol ${state.goal.deadlineSol}) | Coords: ${state.goal.coords}`,
            );
            const reqLines = state.goal.requirements.map(
                (r) => `${r.current >= r.target ? '[DONE]' : '[  ]'} ${Math.min(r.current, r.target)}/${r.target} ${r.label}`,
            );
            setText(world, statusReqsLbl, `Mission Requirements:\n${reqLines.join('\n')}`);
            setText(
                world,
                statusForecastLbl,
                `Tomorrow (Sol ${state.sol + 1}): ${state.tomorrowForecast.weather} (${state.tomorrowForecast.temperatureC}C) | Rad: ${state.tomorrowForecast.radiationRisk}`,
            );

            logData.setItems([...state.dailyLog]);
            if (state.dailyLog.length > 0) {
                logList.scrollToIndex(state.dailyLog.length - 1);
            }
        }

        refreshAllUI();
        // Present Sol 1 Morning Briefing & Event on initial frame
        if (state.currentEvent) {
            modals.openEventModal();
        }
    },
    { name: 'GameUiSystem' },
);

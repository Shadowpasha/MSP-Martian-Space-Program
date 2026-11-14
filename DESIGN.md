# MSP — Mars Station Program
## Visual Design System & Art Direction Bible

**Document ID:** `MSP-ART-001`  
**Version:** `1.0` — 14 November 2026  
**Status:** Design baseline for implementation  
**Audience:** UI engineers, game/frontend engineers, pixel artists, animators, technical artists and QA  
**Scope:** Visual identity, pixel-art production, UI composition, motion, and asset handoff. **Not** a product requirements document or gameplay specification.

---

## 1. Purpose and source of truth

MSP needs to feel like **one game**, regardless of which developer builds a screen. This document standardizes the visible language established in the current **Main Menu**, **Crew**, and **Upgrade** concept images. It governs layout, color, surfaces, fonts, sprites, icons, states, animation and integration.

**North star:** *A compact, lived-in, near-future Martian station rendered as tactile pixel art, wrapped in the legible interface of a serious—but approachable—survival-management game.*

The visual reference points are **Risk of Rain Returns** (dense, readable pixel-art character/select interfaces and confident highlights), **60 Seconds!** (resource pressure, survival and human stakes), and **FTL** (operational clarity). These are *directional references*. MSP must use **original sprites, icons, layouts, logos, fonts and effects**, not traced or extracted assets.

### 1.1 Approved internal visual references

| Priority | Reference image from this conversation | Governs |
|---|---|---|
| 1 | **MSP Crew selection mockup** | Primary UI shell: navy panels, sidebar, cream typography, amber selection, portrait treatment, locked states. |
| 1 | **MSP Upgrade tree mockup** | Tech-tree panel styling, connected nodes, tiers, branch tabs, selected node detail, currency footer. |
| 1 | **MSP Main menu, revised** | Environmental art: Mars vista, station cutaway, lamps, pipes, personnel scale, diegetic control screens. |
| 2 | Initial Main menu mockup | General composition and world mood **only**; its top-right floating resource HUD is superseded. |

**Conflict resolution:** This document overrides one-off mockup artifacts. For uncovered details, prefer the token and component rules below. When a design decision materially changes the established style, update this file *before* diverging in implementation.

### 1.2 Non-negotiable visual rules

1. **Readable first.** Critical labels and numbers must remain clear at 1280×720; art cannot obscure them.
2. **Chunky silhouettes, restrained detail.** Silhouettes read at a glance; texture enriches them only on inspection.
3. **Limited palette.** Deep navy/violet UI, warm cream type, amber/orange selection, rust-red Mars, surgical cyan for in-world telemetry.
4. **Hard-edged UI.** Stepped/chamfered corners, layered outlines, crisp pixel shadows; avoid generic smooth rounded web cards.
5. **One interaction grammar.** Selected = amber illuminated outline/fill; locked = muted plus lock; disabled = low-contrast plus explanation; warning = icon and explicit text.
6. **World and UI stay distinct.** Mars scenery can be busy and cinematic; panels must provide calm contrast and predictable alignment.
7. **No photorealism, no neon cyberpunk.** Technology is functional, industrial and plausibly near-future.
8. **No free-floating top-right resource banner on the main menu.** Resource readouts appear **inside the station's central dashboard monitor** in that scene.

---

## 2. Visual identity

### 2.1 Style keywords

**Industrial • Retrofuturist • Human • Tactile • Weathered • Purposeful • Legible • Warm against cold.**

The world is built from practical habitats, pressure doors, greenhouse racks, orange pressure suits, antenna masts, dust-coated infrastructure, power boxes, storage bins, cables and repair tools. UI surfaces resemble fitted operations hardware rather than glass holograms. Light sources make the interior habitable against the hostile, expansive Mars exterior.

**Emotional hierarchy:** *competence* during planning, *tension* during a shortage, *relief* after recovery. Avoid horror/gore or overtly militaristic styling. Mars is dangerous because its systems are unforgiving, not because the UI is grim.

### 2.2 Shape language

- Use primarily **rectangular modular geometry** with 45° chamfers or pixel-stepped corners.
- Panels have a dark central fill, a 2–4 px equivalent border and one inner bevel/highlight.
- Large interface sections may include **small broken-border motifs** and shallow corner brackets, as seen in the Crew/Upgrade mockups.
- Reserve organic round shapes for the planet, dome, helmet glass, cables, terrain and atmospheric glow.
- Keep silhouettes distinct: **habitat = dome/rounded module; power = batteries/panels; life support = cylinder/pipes; science = instrument/lab; personnel = helmet + backpack + role-specific equipment.**

### 2.3 Depth hierarchy

1. **Backdrop:** static or slowly drifting deep-plum Mars silhouettes.
2. **Environmental scene:** pixel-art station architecture and crew.
3. **UI frame:** near-opaque navy panel bodies and borders.
4. **Content:** portraits, nodes, meters, labels.
5. **Interaction:** amber selection trim, short hover glint, focus ring.
6. **Critical modal:** strong dark scrim + raised panel; background does not compete.

No blurry frosted-glass panel effect. Use gradients sparingly and deliberately; gradients are acceptable for **sky, atmospheric dust, monitor glow**, not as the default fill for every button.

---

## 3. Color tokens

The following hexadecimal colors are **implementation tokens approximated from the approved mockups**, not a claim of exact source-image pixel sampling for every surface. Use tokens; do not invent per-screen color shades.

### 3.1 Core palette

| Token | Hex | Use |
|---|---|---|
| `ink-900` | `#1E1D30` | Deepest UI/background field. |
| `ink-800` | `#212031` | Panel body, large content backdrop. |
| `ink-700` | `#323149` | Raised panels, inactive buttons, headers. |
| `ink-600` | `#36354B` | Secondary surfaces and inset wells. |
| `edge-500` | `#555064` | Default panel borders, dividers and node outlines. |
| `edge-300` | `#777185` | Secondary border highlights, subtle icon outlines. |
| `text-primary` | `#E8DCDD` | Titles, critical values and primary button text. |
| `text-secondary` | `#BDB1BC` | Supporting labels/body copy. |
| `text-muted` | `#918898` | Disabled or low-priority metadata. |
| `amber-400` | `#EEB166` | Selected tab, active sidebar item, selected portrait frame. |
| `amber-300` | `#F8C574` | Hover/focus and high-priority button face. |
| `mars-600` | `#A25754` | Distant atmosphere and terrain midtone. |
| `mars-500` | `#D0685A` | Mars sunset/foreground detail. |
| `rust-700` | `#573548` | Terrain shadow and surrounding structures. |
| `cyan-800` | `#145360` | In-world monitor backdrop. |
| `cyan-400` | `#65CCD0` | Live telemetry, scan lines, in-world displays. |
| `green-400` | `#87B77A` | Beneficial effect, growth / healthy systems. |
| `red-400` | `#D96C6C` | Negative effect, hazard, critical alert. |
| `white-100` | `#F3ECEA` | Sparse top-level highlights only. |

**Color allocation target:** ~75–85% neutral darks; ~8–15% typography and icon light values; ~5–10% accents and status. Scenic artwork can have a larger Mars-red area, but UI controls should not.

### 3.2 Semantic state mapping

| State | Visual treatment | Additional information required |
|---|---|---|
| Default | `ink-700` + `edge-500` | Label / recognizable icon. |
| Hover | Border brightens toward `amber-300`; +1–2 px stepped offset/glow | Cursor/tooltip response. |
| Selected | Thick `amber-400` border or amber-filled sidebar item | Current section or selection remains visibly marked. |
| Focus (keyboard) | High-contrast inset/outset outline, distinct from hover | Must be visible when color vision differs. |
| Available / affordable | Normal text, active control | Cost and prerequisites legible. |
| Locked | Dark desaturated silhouette, `edge-500`, lock glyph | Unlock reason exposed on inspect. |
| Disabled / unaffordable | Muted control and lower contrast; **not** identical to locked | Explicit “Need 2 more points”, etc. |
| Positive effect | `green-400`, upward icon | Explicit numeric effect text. |
| Negative effect | `red-400`, downward icon | Explicit numeric effect text. |
| Warning | Amber + triangle or alert icon | Plain-language warning. |
| Critical | Red + icon + steady or restrained pulse | Plain-language critical state. |

**Never encode meaning in color alone.** Icons, numerals and labels are mandatory for resource warnings, upgrades and crew traits.

---

## 4. Pixel-art production rules

### 4.1 Resolution strategy

- **Reference aspect ratio:** 16:9 landscape.
- **Target review canvases:** 1920×1080 and 1280×720.
- **World-art logical canvas:** **640×360**, scaled at integer multipliers (3× at 1080p; 2× at 720p), or another explicitly declared equivalent logical size. Do not mix scale systems between artists.
- **Browser UI:** DOM/text may render at native display resolution for legibility, but panel edges, icons and spacing must **snap to a consistent 4 CSS-px design grid at 1080p** (proportionately adapted elsewhere).
- If art and UI have different native resolutions, test the composite at both targets before asset approval.
- **Pixel sampling:** nearest-neighbor only for pixel sprites/textures; never smooth/linear-scale pixel art. Set `image-rendering: pixelated` for suitable DOM image assets; set `NearestFilter` for game textures.

> The published concept illustrations communicate style, **not** an exact pixel grid. Rebuild production sprites on a fixed grid; do not upscale/downscale arbitrary cropped concept art and call it production-ready.

### 4.2 Sprite sizing and silhouette

| Asset | Recommended source frame | Visual guideline |
|---|---|---|
| Small operational icon | `16×16 px` | Single symbolic idea, 1–2 px stroke rhythm. |
| Standard action/category icon | `24×24 px` | Distinct at 2–3× scale. |
| Crew world sprite | `32×48 px` | Helmet, torso, gear and legs recognizable. |
| Crew portrait bust | `64×80 px` | Consistent crop; upper torso, head and role equipment. |
| Inventory item | `16×16` or `32×32 px` | Placement dimensions separate from rendered bounding box. |
| Tech-node icon | `24×24` or `32×32 px` | One visual metaphor, consistent baseline. |
| Small environment prop | 16–64 px bounding width | Multiple silhouettes, shared lighting direction. |
| Habitat modules / terrain | Tile-based 32 or 64 px increments | Tiles seam cleanly; detailed hero features may span tiles. |

These are **production defaults**, not retroactive measurements of mockup art. Avoid separate portrait illustrations that have incompatible helmet shapes, proportions or palette compared with world sprites.

### 4.3 Character anatomy and costume consistency

- **Proportion:** slightly stylized/stout, oversized head and helmet (~1/3 of figure height), compact torso, short practical limbs, deliberate readable poses.
- **Helmet:** rounded or angular polymer shell with prominent faceplate; avoid realistic facial detail at world scale.
- **Core uniform:** white/gray pressure gear, orange utility/safety panels, charcoal joints, gray packs; not bright superhero costumes.
- **Role recognition comes from gear**, not arbitrary palette swaps alone.
- **Lighting:** upper-left soft warm key light with cool charcoal shadows; simple 2–3-shade material bands and selective reflective pixels.
- **Portrait framing:** consistent head size, same torso crop, centered baseline, sufficient negative space under role/name.
- **Diversity:** vary skin/hair/face where visible, suit silhouettes and equipment; do not imply one role only has one demographic appearance.

**Six established roster examples:** Rourke (**Engineer**, tools/utility pack), Mira (**Medic**, medical cross/med-kit), Hale (**Mechanic**, darker work helmet/grease-tool kit), Keller (**Captain**, command cap/insignia), Ishida (**Scientist**, white hood/goggles/tablet), Vance (**Comms**, headset/antenna/radio harness). Names are example UI copy; the **visual archetypes** are what must remain consistent.

### 4.4 Environment and texture discipline

- Build Mars from layered crater rims, ridges, dunes, fine dust deposits and orange-pink atmospheric haze.
- Interior architecture should repeat a **kit of beams, utility pipes, ladders, catwalks, work lights, bolted boxes, pressure doors and racks**.
- Greenhouse is a deliberate green visual relief among violet/charcoal steel and rust-red dust.
- Reserve cyan for **functional powered screens**; avoid putting cyan outline effects on every prop.
- Use small controlled clusters of texture, not photographic noise or random per-pixel speckling.
- Large silhouettes must read when the scene is reduced to **25% scale**.
- Keep windows and outdoor scenic areas lower contrast than foreground UI where text overlaps them.

---

## 5. Typography and copy presentation

### 5.1 Type hierarchy

Use **two intentionally coordinated type styles**, not one tiny pixel font for everything:

| Level | Suggested treatment | 1080p guide |
|---|---|---|
| Screen title | Crisp bold pixel/square display | 36–46 CSS px |
| Section heading | Bold pixel/square display | 20–26 px |
| Character name / selected tech | Bold pixel/square display | 22–28 px |
| Primary navigation | Bold pixel/square display | 28–34 px |
| Body description | Clean mono/humanist-sans, legible at 720p | 17–20 px |
| Secondary metadata | Clean mono/humanist-sans | 15–17 px |
| Tiny machine labels (non-critical) | Pixel/mono | 13–15 px |

**Typeface direction:** a legally usable pixel display face (e.g. **Pixelify Sans**) for headings and short labels paired with a restrained readable sans/mono face (e.g. **IBM Plex Sans/Mono**) for supporting copy. Final font files and licenses must be included in the repository. Use only licensed fonts, and do not attempt to extract the reference game's typeface.

### 5.2 Copy / glyph rules

- Prefer `O₂` or `O2`, `PWR`, `RES`, `Food/Water`, `Morals` **as shown in the revised main-menu mockup**. **Terminology decision needed:** the label `Morals` in the concept may intend crew **Morale**. Do not silently rename it in individual screens; settle the canonical product label once and update localization constants.
- All caps for tiny equipment labels and tier tags; title case for actions, people, categories and descriptions.
- Use thousands separators consistently (e.g. `1,240`).
- Limit tech-node descriptions to **2–3 short lines** in the inspector; overflow gets explicit wrapping/scrolling, never shrink-to-fit into unreadability.
- Align values on tabular numerals. Use `font-variant-numeric: tabular-nums` when available.
- Confirm font glyph coverage for `₂`, `%`, `+`, `−`, arrows and any localization target.

---

## 6. Spatial layout and reusable shell

### 6.1 Shared navigation shell (Crew, Upgrade, future pages)

```text
┌──────────────────────────────────────────────────────────────────────┐
│ [MSP logo]       [page icon]  Page title and one-line subtitle      │
│                                                                      │
│ ┌────────────┐ ┌──────────────────────────────┐ ┌─────────────────┐ │
│ │ Play       │ │ Main work area                │ │ Detail inspector │ │
│ │ Crew       │ │ grid / tech tree / board      │ │ portrait / info  │ │
│ │ Upgrade    │ │                               │ │ effects / CTA    │ │
│ │ Settings   │ │                               │ │                 │ │
│ │ Quit       │ │                               │ │                 │ │
│ └────────────┘ └──────────────────────────────┘ └─────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

**Desktop proportional starting point:** left navigation ~19–21% width; main content ~48–51%; right inspector ~25–28%; remainder split between gutters. Header ~11–13% height. Align left edges and panel top edges across pages. Do not reposition the logo or sidebar between Crew and Upgrade.

At narrower widths: first reduce decorative scenery, then switch the inspector to a slide-in detail drawer or stacked panel. Maintain the five navigation destinations. Never scale type below its minimum size solely to preserve the 3-column layout.

### 6.2 Primary UI components

| Component | Canonical appearance | Interaction expectations |
|---|---|---|
| `NavButton` | Wide charcoal rectangle, stepped/chamfered edges, left role/icon, cream label. | Active has amber fill + dark text; inactive dark; hover and focus distinct. |
| `Panel` | Deep navy fill, double-edge bevel, angular/bracket detail. | Consistent 12–16 px visual gutters at 1080p. |
| `PanelHeader` | Thin lighter header strip, small icon, bold title. | Content does not overlap trim. |
| `PrimaryButton` | Solid warm amber, dark bold text, thick border, pressed pixel offset. | Enabled/disabled/hover/focus/loading states required. |
| `SecondaryButton` | Dark fill, neutral outline, warm focus border. | No false impression of primary priority. |
| `CrewCard` | Portrait top, lower name + role strip, single-line indicator. | Selected thick amber frame; locked dark silhouette + lock. |
| `TechNode` | Square icon well, thin structural border, cable/branch connector. | Unlocked check; selected amber edge; locked lock; affordable identified. |
| `TraitRow` | Directional glyph + semantic accent + title + one line of effect. | Positive/negative must be readable without color. |
| `ResourceMeter` | Icon + short label + segmented bar + numeric value. | Explicit label and amount; danger state uses words. |
| `Tooltip` | Near-opaque charcoal with cream copy and 1px stepped trim. | No delay for keyboard; within viewport. |
| `Modal` | Full-page restrained scrim, centered raised panel with clear decision. | Escape/back behavior; default keyboard focus. |

**Spacing tokens:** 4-px foundation; `xs=4`, `sm=8`, `md=12`, `lg=16`, `xl=24`, `2xl=32`, `3xl=48`. Panel inner padding usually 16–24; buttons 12–16 vertical; grid gaps 12–16. Adjust using the same scale, not arbitrary 13/19/27 px values.

**Borders:** choose from **2 / 4 px** equivalents; corner cuts based on 4 / 8 px grid. Do not mix pill-shaped, soft-radius, or Material-style shadows into the game UI.

---

## 7. Screen-specific art direction

### 7.1 Main menu — environmental hero scene

**Composition:** The left fifth-to-third is a strong **MSP: Mars Station Program** logotype and five stacked navigation buttons: **Play / Crew / Upgrade / Settings / Quit**. The right contains a large **cross-section view of an inhabited Mars base**, framed by structural beams and a panoramic orange landscape. Multiple readable vignettes: greenhouse, control room, engineering/storage lower level, and crew working at equipment.

**Signature details:** red-orange Mars in the sky, dusty distant ridges, modular habitats/domes, solar panels, radio dish, warm work lights, amber pressure suits, cyan control monitors, orange hazard markings.

**Resource placement rule (important):** no floating global materials/status UI in the **top-right** of the main menu. The **central station dashboard monitor**, inside the illustrated interior, may display **O₂ / PWR / RES / Food/Water / Morals** and small segment bars. That readout is **diegetic environmental art**, not a functional page-level HUD. Text readability can be approximate at scene scale, but resource label ordering and visual rhythm should match the mockup.

**Active state:** `Play` begins highlighted with cyan/teal energized treatment *only for this main-menu hero presentation*, matching the established concept; the consistent **amber active-sidebar pattern** governs the Crew and Upgrade content pages. Cyan hero treatment must not spread to general buttons elsewhere.

**Motion:** slow exterior dust/parallax, sparse monitor blinks, greenhouse grow-light animation and subtle workstation idle poses. Menu selection glow can brighten on hover. Never animate the full scene at high frequency.

### 7.2 Crew selection — portrait-driven roster

**Composition:** fixed shared shell. The central panel contains:

- **Available Crew (6)**: a **3 × 2** roster grid of large portraits with names and roles.
- **Locked Crew**: horizontal strip of desaturated silhouette cards with central lock marks and optional horizontal pagination.
- The right inspector: **large cropped selected portrait + name/role**, compact descriptive paragraph, **Traits** cards, **Task Focus** icon row, and one obvious **Add to Crew** CTA.

**Visual behavior:** Only one roster portrait has an amber selected outline at a time. Selection updates the inspector, not the navigation. Distinguish available-but-not-added, selected, already-added and locked states with badges/text, not only frame color.

**Character differentiation:** consistent suit construction + distinct accessories; engineer is light gear and utility harness, medic has medical markings, mechanic has dark heavier work helmet, captain has command cap, scientist has white hood/goggles, comms has radio antenna/headset. Portraits should share eye-line, head size, torso scale, lighting and a common panel background.

**Inspector content treatment:** positive trait (green up glyph), drawback (red down glyph); square task choices with simple icons and labels such as **Maintain**, **Produce**, **Research**, **Scavenge**. These are visual placeholders for categories; implementation should consume actual game data rather than hardcode art-label combinations.

**Empty/locked state:** silhouettes remain readable but non-identifying. Don't reveal future character artwork underneath overly transparent lock overlays. If the roster grows, preserve card dimensions and introduce scrolling/pagination rather than shrinking the portraits.

### 7.3 Upgrade — branching technology tree

**Composition:** shared shell; left `Upgrade` selected in amber. Main workspace has **four illustrated category tabs**: **Infrastructure**, **Survival**, **Operations**, **Crew**. Beneath them is the technology graph, with tier labels **T1–T4**, vertically aligned columns, nodes and orthogonal branch connectors. Right inspector shows a large machine/technology vignette, technology name, tier, short rationale, effects, requirements and final unlock CTA.

**Visual behavior and graph grammar:**

- Tree rails and connectors run on the 4-px grid with **right-angle** turns, never loose Bézier spaghetti.
- **Owned node:** warm thin border and corner checkmark; stronger than standard nodes but weaker than current selection.
- **Selected node:** amber focus frame and highlighted route path.
- **Available node:** bright neutral icon, readable normal border.
- **Locked node:** low-chroma silhouette/outline + small corner lock; prerequisites link back to parent.
- **Unaffordable selected node:** inspector still displays full details; CTA muted with explicit missing-points message.
- **Connector states:** owned path amber, available path muted lavender, inaccessible path dim gray; do not rely on color alone—node/check/lock states carry the meaning.

**Content example retained from mockup:** **Oxygen Recycling II** with recycler machine art, oxygen consumption effect (green beneficial marker), requirements checkboxes, and cost vs current upgrade points. Treat numbers as example content, **not** the design team's source of gameplay balance.

**Navigation:** mouse drag/pan or horizontal scrolling where needed; mouse wheel vertical scroll, controller/keyboard node traversal with obvious focus. Keep category tabs, selected node name, points total and Unlock CTA reachable/readable without disorienting map movement.

### 7.4 Future screens — consistency rules, not new feature mandates

| Screen if implemented | Visual extension |
|---|---|
| **Station overview** | Station cutaway and control consoles from the main menu; resource values placed on deliberate dashboard panels, not floating over scenery. |
| **Mission selection** | Three structured mission-card panels with Mars thumbnail, risk tags, equipment icons and one clear primary action. |
| **Crew assignment** | Reuse `CrewCard` portrait geometry and selected state; task destination tiles share `TechNode`/action-card icon scale. |
| **Cargo / equipment** | Pixel-grid inventory with beveled slots, item sprites, amber selection/placement preview, explicit invalid state. |
| **Expedition map** | Top-down original Mars tiles using same terrain palette; navy HUD panels; fog/monitoring layers with clear legends. |
| **Crew decision / event** | Portrait + text panel over dimmed station/map; 2–3 large action cards using existing button language. |
| **Debrief** | Dark operations-report panel with restrained gold highlights; clear summary hierarchy and small science illustrations. |
| **Settings** | Shared shell, amber active navigation, consistent toggles/sliders/select rows and wide hit targets. |

Do **not** create an entirely new visual theme for each page. The game should feel like a single OS installed across the station's equipment.

---

## 8. Iconography, effects and motion

### 8.1 Icon set

Maintain a **single original 16/24/32 px icon family** with consistent stroke rhythm, perspective and visual weight. Representative motifs:

- Crew = three-person silhouette; Engineer = crossed tools; Mechanic = gear; Medic = plus; Captain = chevrons; Scientist = flask; Comms = antenna.
- O₂ = tank/cylinder; PWR = lightning bolt; RES = crate; Food/Water = leaf/drop; Morale/Morals = group or face mark.
- Tech = circuit/plant/battery; locked = padlock; owned = check; unavailable = strike/alert.

Use **1–2 readable colors per icon** plus a state accent. Avoid emoji in shipped UI, mixing imported outline-vector packs with pixel sprites, or using realistic icons beside flat pixel icons. Icons must remain distinct without their labels, but labels still appear at relevant interaction scale.

### 8.2 Animation specification

| Interaction | Suggested duration / cadence | Visual rule |
|---|---|---|
| Button hover | 80–140 ms | Border brightens/steps outward; no smooth float. |
| Button press | 60–100 ms | 1–2 px inward stepped offset + shadow reduction. |
| Card selection | 120–180 ms | Amber frame illuminates; inspector refreshes with minimal transition. |
| Tech unlock | 250–500 ms | Node check appears, connectors light outward, discreet particle accent. |
| Resource decline | 200–350 ms | Segments decrement; label/value stays stable. |
| Monitor activity | 1–4 s sparse cadence | 1–2 frame scan/blink or tiny waveform. |
| Crew idle | 2–5 s sparse cadence | Gentle head/hand/breathing sprite frame shift. |
| Dust ambience | 8–20 s loop | Subtle low-speed parallax, not a full-screen particle blizzard. |

Prefer short **stepped** sprite changes over bouncy modern easing. Keep movement decorative, not obstructive. Respect `prefers-reduced-motion`: stop parallax/particles and keep only essential state changes.

### 8.3 Glow and post-processing

Use glows **selectively**: `Play` hero button, powered monitors, small indicator LEDs, and occasional confirmation flashes. Glow does **not** smooth sprite edges; render a low-opacity halo *behind* sharp pixel foreground. No global chromatic aberration, heavy bloom, faux CRT filter or scanline overlay on body text by default.

---

## 9. Technical UI and art integration contract

### 9.1 Suggested project structure

```text
src/
  art/
    palette.ts             # Named design tokens
    atlas/                 # Packed environment and sprite atlases
    crew/                  # Per-character source exports and portraits
    icons/                 # One canonical family
    backgrounds/           # Mars/parallax environment
    fx/                    # Glow, dust and animation frames
  components/
    shell/                 # AppFrame, Sidebar, PageHeader
    ui/                    # Panel, Button, Meter, Tooltip, Modal
    crew/                  # CrewCard, CrewInspector, TraitRow
    upgrades/              # TechNode, TechConnector, UpgradeInspector
  styles/
    tokens.css             # Colors, spacing, sizing, type
    typography.css
    components.css
  screens/
    MainMenu/
    Crew/
    Upgrade/
```

### 9.2 Minimal style tokens (reference implementation)

```css
:root {
  --msp-ink-900: #1E1D30;
  --msp-ink-800: #212031;
  --msp-ink-700: #323149;
  --msp-edge: #555064;
  --msp-text: #E8DCDD;
  --msp-text-muted: #918898;
  --msp-amber: #EEB166;
  --msp-amber-hover: #F8C574;
  --msp-cyan: #65CCD0;
  --msp-good: #87B77A;
  --msp-bad: #D96C6C;
  --msp-grid: 4px;
  --msp-space-sm: 8px;
  --msp-space-md: 12px;
  --msp-space-lg: 16px;
  --msp-space-xl: 24px;
}

.pixel-art {
  image-rendering: crisp-edges; /* fallback where supported */
  image-rendering: pixelated;   /* preferred for pixel art */
}
```

**Important:** Test `image-rendering` behavior in target browsers. Do not apply pixelation filters to DOM text. Prefer explicit sprite dimensions; avoid fractional transforms on sprites. Confirm the pixel rendering declaration in each supported browser and ensure sprites are drawn at integer scales.

### 9.3 Art export contract

Every shipped visual asset must declare:

- **Asset ID** and intended component/screen.
- **Native width/height** and intended render scale; transparent PNG/WebP as appropriate.
- **Pivot/anchor**, especially for character sprites and placement effects.
- **Frame dimensions, count, order and FPS** for animations; no variable frame cells in one sprite strip.
- **Palette category** (environment / crew / UI / telemetry), lighting direction and outline rules.
- **Sprite atlas padding / extrusion** (at least 2 source pixels where packed to prevent texture bleeding).
- **Licensing/source provenance**: original or appropriately licensed; no extracted reference-game art.

Recommended source format: **Aseprite `.aseprite`** or equivalent layered editing source, plus runtime exported spritesheets and a small JSON metadata manifest. Export **without baked CSS scaling**, antialiasing or unexpected compression artifacts. Commit editable sources wherever team licensing permits.

### 9.4 Asset naming standard

Use lowercase snake_case and stable prefixes:

```text
ui_nav_play_default.png
ui_nav_play_active.png
ui_panel_header_9slice.png
ui_icon_medical_24.png
crew_rourke_portrait_64x80.png
crew_rourke_idle_32x48_sheet.png
crew_mira_portrait_64x80.png
tech_oxygen_recycling_ii_32.png
tech_connector_owned_horizontal.png
env_station_greenhouse_module_a.png
env_mars_ridge_far_01.png
fx_monitor_blink_01.png
```

Prefer one **stateful component** driven by tokens when feasible over numerous nearly identical raster state exports. Nine-slice/pixel-panel assets must use integer slice bounds and be checked for seam artifacts at both target resolutions.

### 9.5 React / Three.js integration

- **UI:** semantic React/HTML for text, keyboard navigation and menus; custom CSS/pixel slices for appearance.
- **Environment/map:** Three.js with orthographic camera and nearest-neighbor textures where used; visible scene underneath overlays.
- **Layer order:** environment canvas `0`; scenery effects `10`; panels `20`; tooltip `40`; modal scrim `50`; modal content `60` (relative conceptual order, not mandatory CSS numeric values).
- **Input:** UI overlays must consume pointer input so clicking a panel never also selects a tile behind it.
- **Data:** inventory values, roster state and upgrade eligibility are provided by application state. **Do not paint dynamic game values into background art** unless explicitly non-interactive/decorative.
- **Performance:** atlas static tiles, avoid redundant textures and excessive per-frame DOM reflows; aim for a responsive browser experience on midrange machines.

---

## 10. Accessibility and responsiveness

**Usability is part of the art direction**, not a post-production accessibility layer.

- Maintain comfortably readable critical text at **1280×720**. If panels become crowded, truncate only optional lore, and provide accessible expansion.
- Aim for WCAG AA contrast where practical: **4.5:1** body text; **3:1** large text and meaningful UI boundaries. Check real color/background combinations, especially amber text on light buttons and muted lavender on dark gray.
- Use **at least 40×40 CSS px** for principal click targets at desktop scale, preferably 44×44 for touch-friendly controls.
- Full keyboard focus path: sidebar → content grid → inspector → CTA, with consistent back/Escape behavior.
- Provide text equivalents/ARIA labels for icon-only controls and tech tree nodes.
- Allow reduced motion and a high-contrast mode by token override rather than drawing a second inconsistent visual theme.
- Do not pin controls over faces or key station machinery at alternate aspect ratios; crop atmosphere first.
- Test at **1920×1080, 1600×900, 1366×768 and 1280×720**, and at 125% browser zoom.

---

## 11. Design review and sign-off checklist

No new screen, character sheet or UI component should be merged without checking the following:

### Shared identity

- [ ] Uses the **MSP** original logo treatment, consistent sidebar shell and page header.
- [ ] Uses **named palette tokens**, not improvised per-screen colors.
- [ ] Uses consistent panel borders, stepped corners and 4-px spacing rhythm.
- [ ] Uses the established type hierarchy; no critical text becomes tiny.
- [ ] Matches the game's practical, lived-in Mars world—not fantasy spaceship/neon hacker styling.

### Components and states

- [ ] Buttons/cards/nodes cover default, hover, focused, selected, disabled and locked (if applicable).
- [ ] Selected state is visually stronger than merely hovered.
- [ ] Locks have a lock symbol and understandable unlock explanation.
- [ ] Beneficial/negative effects have both semantic icon and explanatory text.
- [ ] Text never intersects pixel borders, icons, cropped portraits or node connectors.

### Assets and delivery

- [ ] Sprites use an agreed native grid and integer rendering scale.
- [ ] Icon strokes, portrait crop and character proportions match their reference families.
- [ ] Source editable asset, export and naming metadata are all included.
- [ ] No unlicensed/copy-extracted reference-game art or fonts.
- [ ] Screen is reviewed side-by-side with the **Main Menu**, **Crew** and **Upgrade** reference mockups.
- [ ] Checked at target resolutions, with keyboard and reduced motion, and with long labels.

### Main-menu-specific regression check

- [ ] **No top-right floating resource/materials HUD.**
- [ ] **Resource indicators are inside the central in-world dashboard**, if shown.
- [ ] Left menu order is **Play / Crew / Upgrade / Settings / Quit**.

---

## 12. Ownership, change control and first implementation milestones

**One visual owner** should approve visual exceptions and update this document. Engineers should build reusable tokens/components rather than locally recreating the mockups. Pixel artists should make and review one reference character and one reference prop before producing the roster or full tileset.

**Recommended production order:**

1. **Foundation:** palette + font selection + reusable panel, tab, button, icon and sidebar components.
2. **Character master:** finalize Engineer portrait/world sprite, then derive the other five roles using a shared template.
3. **Crew screen:** 3×2 roster, locked silhouettes, inspector and all interaction states.
4. **Upgrade screen:** node icons/connectors, four tabs, inspector and affordable/locked/selected states.
5. **Main menu environment:** modular station art, Mars panorama, diegetic screen and modest ambience.
6. **New screens:** reuse the established primitives; introduce new widgets only after style review.

### 12.1 Decisions requiring one team-wide resolution

| Decision | Default in this document | Owner / action |
|---|---|---|
| Exact font pair and licensing | Pixelify Sans + IBM Plex family *as candidates* | Art/UI lead to approve actual files. |
| `Morals` versus `Morale` | Retain current mockup text until canonical copy decided | Design/product owner to confirm once. |
| Sprite canvas target | 640×360 world-art logical resolution | Technical artist + frontend lead validate. |
| Crew portraits vs world sprite ratio | 64×80 and 32×48 source guidelines | Pixel artist to test approved example. |
| Tech tree compactness at 720p | Keep node readability; inspector can become drawer | UI engineer + artist to test responsive layout. |
| Main-menu active button cyan exception | Allowed **only** for environmental hero menu | UI lead to ensure state consistency elsewhere. |

**Definition of done:** A user should be able to switch between Main Menu, Crew, Upgrade and any newly implemented screen and instantly recognize the same visual universe—with matching silhouettes, palette, component grammar, typography and interaction feedback—without knowing which developer implemented each page.

---

*End of MSP Visual Design System & Art Direction Bible, v1.0.*

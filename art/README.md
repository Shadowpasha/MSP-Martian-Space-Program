# MSP pixel art sources

`menu_station_source.png` and `crew_portraits_source.png` are the original ImageGen artwork used by this build. The runtime station is a 640×360 nearest-neighbor export. The six keyed crew portraits are 64×80 with bottom-center anchors. Mission thumbnails and the sidebar are game-sized crops of the station source. The locked portrait is an anonymous EVA helmet silhouette.

`flight_icon_sources.png` contains the supplied MSP icons alongside the matching navigation and equipment glyphs made for this build. Its 8×4 grid has transparent 32×32 cells. Runtime icon tinting provides contextual states for monochrome glyphs. Multi-color equipment and technology icons use the original sprite palette.

The original prompt and export roles are recorded in [image-prompts.md](image-prompts.md). Runtime PNGs and their Estella import settings are under `assets/textures`. The typefaces and SIL Open Font License texts are under `assets/fonts`.

`tharsis_station_source.png` and `tharsis_site_source.png` are the full-resolution gameplay backgrounds. `export.mjs` builds their 640×360 nearest-neighbor textures for the station and the expedition screens.

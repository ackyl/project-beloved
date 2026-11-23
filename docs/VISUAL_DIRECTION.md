# BELOW, BELOVED — VISUAL AND FEEL

## Intent

A quiet, beautiful underground world that increasingly troubles the *player*, while the android responds with curiosity. The game's visual hierarchy prioritizes a living, navigable mining environment over application UI.

## Scene composition

- **Cave:** side-view pixel-art presentation, chunky and visually varied tiles, dark silhouettes, luminous crystal veins and bioluminescent organic formations. Low-resolution internal rendering may be scaled with nearest-neighbor interpolation.
- **Android:** distinct small silhouette and directional movement/impact cues; bright enough to track in darkness. No large animation sheet is required initially; small sprite shapes are fine.
- **Sanctuary:** tiny warm mechanical base at the top/entry. Android tools, specimen console, storage and a **closed curtain** separating the human's location. **No visible bed or human body.** The curtain is always closed in the slice. A dim monitor and breathing sound indicate presence.
- **Contrast:** amber/cream cozy base versus blue-green/violet cave glow; horror appears through unsettling composition, repetition and evidence, not gore or scare flashes.

## Feel details

- Contact mining: immediate hit pulse and crunchy sound, impact particles, brief hit/damage stage, clear break. Different material hardness is felt without long waiting.
- Moving: quick, responsive float, consistent directional control; camera smooth but not laggy.
- Specimens: distinct silhouette and light behavior; subtle periodic response to player interaction.
- Narrative discovery: environmental evidence first, one short android observation afterwards. Do not block movement for lengthy exposition.
- Human care: curtain, monitor change, small audio cue; a short, quiet emotional moment rather than a big cutscene.

## UI direction

- React shell uses compact dark panels, neutral body text, restrained accent colors, good touch targets. Avoid ornamental dashboards, generic startup landing pages, overly polished SaaS visuals, and huge menus.
- The game world must occupy most available space. On mobile, use collapsible/compact HUD and a translucent thumb-accessible movement pad. On desktop, show controls only as needed.
- Styling baseline can start with `#0a0a0a` page, `#141414` surface, `#303030` border, `#f2f2f2` text, but the world should be richer and warmer than the shell.
- Explicitly label uncertain or prototype visuals as placeholder assets; no third-party art required.

## Audio

- Optional lightweight Web Audio cues for dig hits, break, specimen resonance and patient monitor. User gesture gates audio; mute button; reduced-motion preference respected. Do not block the first slice on music/audio availability.

## Minimum visual quality bar

It must immediately read as a side-view **mining game**: a visible android moving into rock, excavated paths staying open, different tile materials, collectible glows, a persistent home location, and a recognizable sealed annex. A static picture plus buttons does not meet the bar.

# BELOW, BELOVED — IMPLEMENTATION PLAN

**Goal:** a complete playable vertical slice. Execute in meaningful chunks with typecheck, tests and production build after each stable milestone. Do not progress while critical defects remain.

## Chunk 1 — Running game and tactile excavation

Initialize Vite/React/strict TypeScript/Vitest and repository docs. Implement a real Canvas game viewport, player movement in four directions, collision mining driven by held direction, material hardness 1/2/3 hits, tile rendering, camera, mobile directional pad and desktop input, concise HUD and responsive layout. Add deterministic simulation and unit tests.

**Acceptance:** Start game → float into stone → visible repeat hits → tile breaks → move through opening. No click-to-mine requirement, gravity or jumping. Works with keyboard and touch. `typecheck`, `test`, `build` pass.

## Chunk 2 — Cave, discoveries and reliable return

Create deterministic finite-but-large procedural cave, material distribution, collectibles/inventory, starting sanctuary, safe return path and handcrafted annex template. Add a context-sensitive hold-to-open panel interaction and concise environmental clues. Add tests for reproducible generation, guaranteed critical discoveries, collision, mining and item persistence.

**Acceptance:** Player can mine outward, find both resources and the luminous specimen, locate and open annex via hold interaction, and get back to base. No critical item softlock. Same seed reproduces world layout.

## Chunk 3 — Research, human care and narrative revelation

Implement small base overlay for tests, hypothesis selection, creation/administering of one treatment, gentle periodic patient needs and non-lethal state updates. Human stays behind a closed curtain and bed is never rendered. Add an authored observation in the annex and a linked response from behind the curtain after treatment. Add tests for deductions, incorrect attempts, treatment validation, care limits, complete loop and restart.

**Acceptance:** Player can complete: dig → specimen → annex clue → return → tests → infer → treat → hear/see unsettling response. No cutscene is needed. Typecheck/tests/build pass.

## Chunk 4 — Feel, usability, release verification

Improve mining feedback, particles, lighting, sound if feasible, mobile controls, layout across short portrait/regular portrait/desktop, accessibility, onboarding, restart and clear victory-of-slice feedback. Fix logic/UI discrepancies and update docs according to actual code.

**Acceptance:** Run `npm run typecheck`, `npm run test`, `npm run build`, and `npm run preview`; exercise the playable loop in built preview on available browser environments. Report exactly what was or was not tested, with failures and limitations. Don't claim cross-device verification unless actually performed.

## Quality gates

- End-user sees an interactive game, not a React dashboard masquerading as one.
- Gameplay is deterministic and authoritative: invalid commands cannot mutate state.
- No missing assets, obvious input latching, inaccessible controls or broken base transitions.
- Each complete story beat has mechanical setup and consequence; don't front-load exposition.
- Avoid feature creep: no combat, creature AI, hunger, full ecosystem simulation, elaborate upgrades or excessive UI components.
- Commit `package-lock.json` and update `DEVELOPMENT_STATUS.md` with measured results.

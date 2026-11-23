# BELOW, BELOVED — ARCHITECTURE

## Stack

- React + React DOM; TypeScript strict; Vite with official React plugin; plain CSS; Vitest; npm lockfile; Vercel static `dist/`.
- Choose a mutually compatible maintained dependency set at implementation time; document Node requirement, record exact versions in lockfile. No backend, router, accounts, or external services.
- **Canvas 2D for the world:** tilemap, character, lighting overlays, effects, and camera. **React DOM for application shell:** HUD, prompts, menus, base research/care overlay, touch buttons, accessibility affordances. Never render the mining tilemap as hundreds of React DOM cells.
- Vanilla Canvas is the default. Do not add a game engine or dependency unless measured need justifies it.

## Project skeleton

```text
index.html
package.json
package-lock.json
tsconfig.json
vite.config.ts
README.md
src/
  main.tsx
  components/
    App.tsx
    GameCanvas.tsx
    HUD.tsx
    BasePanel.tsx
    TouchControls.tsx
  game/
    types.ts
    commands.ts
    simulation.ts
    world.ts
    generation.ts
    research.ts
    config/
      balance.ts
    data/
      materials.ts
      specimens.ts
      discoveries.ts
  rendering/
    drawWorld.ts
    camera.ts
    effects.ts
  input/
    controls.ts
  styles/
    main.css
  tests/
    mining.test.ts
    world.test.ts
    research.test.ts
    care.test.ts
    loop.test.ts
docs/
  GAME_DESIGN.md
  MECHANICS.md
  ARCHITECTURE.md
  VISUAL_DIRECTION.md
  IMPLEMENTATION_PLAN.md
  DEVELOPMENT_STATUS.md
```

Create files as needed rather than generating empty architectural ceremony.

## State and commands

`keyboard/touch input → typed game command → pure/state-isolated simulation validation → next authoritative state + events → Canvas + React render`

- Game state: player position, facing, seed, terrain/durability, discovered landmarks, inventory, research test flags, recipe knowledge, human-care status, progress flags, simulation clock.
- Typed commands: direction press/release or `moveIntent`, `tick`, `interactStart`/`interactStop`, `runTest`, `selectHypothesis`, `craftTreatment`, `administerTreatment`, `purchaseUpgrade`, `restart`.
- UI state: modal visibility, focus, animation progress and input ownership. The game layer must validate every consequential command, including inaccessible or duplicate actions.
- For continuous movement, use `requestAnimationFrame` as a clock source and advance the game with fixed timesteps (e.g. 60 Hz), clamp large elapsed deltas; deterministic mining cadence and held interaction progress live in game state, not visual animation state.
- Use explicit seeded PRNG, not `Math.random()` inside deterministic simulation. The generated map for a given seed and the same actions must be reproducible.
- Avoid unnecessary React re-renders on every frame; Canvas reads snapshots from a mutable runtime/controller while React subscribes to slower-changing UI state or meaningful game events. Keep simulation independent of React and DOM.
- Handle `visibilitychange`, pointer cancel and lost pointer capture. Prevent browser scroll on the control surface only. Device-pixel-ratio scaling and resize handling are required.

## World generation and authored discoveries

- Use a deterministic generator with safe starting pocket, mineable connected regions, resource guarantees, and **guaranteed placeable** handcrafted annex template.
- Define spatial exclusions/clearance around the base and annex before procedural fill. Validate connectivity and retry deterministic generation when necessary.
- A finite seeded world is acceptable for v0.1. Do not claim true infinity or implement endless chunk persistence until needed.
- Keep terrain visual types separate from durability and specimen logic; define materials as data.

## Saved state

- No mandatory persistence in first slice; restart with fixed/default or selectable seed is sufficient. If implementing save for convenience, version and validate payloads and keep it fully local.

## Accessibility and performance

- Touch + keyboard/mouse, legible HUD and dialogs, reduced motion, contrast, visible focus, labeled actions and muted Web Audio controls if sound implemented.
- Target phone portrait first, then desktop. Keep the mining surface dominant and interactive, with base UI as focused overlay instead of an admin dashboard.
- Canvas art can be procedural placeholders, but must resemble a **game scene**, with tiles, sprites, particles, lighting and spatial navigation.

## Commands

`npm install`, `npm run dev`, `npm run typecheck`, `npm run test`, `npm run build`, `npm run preview`.

Vercel: Vite, `npm run build`, `dist/`; no SPA rewrite required with single route.

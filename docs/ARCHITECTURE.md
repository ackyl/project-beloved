# PROJECT BELOVED — ARCHITECTURE

## Stack

- React and React DOM, strict TypeScript, Vite with the official React plugin, plain CSS, Vitest and an npm lockfile. The build is a static `dist/` suitable for Vercel.
- No backend, router, accounts, external services, game engine or physics library. Add a dependency only when a measured need justifies it.
- **Canvas 2D for the world:** tilemap, sprites, corpses, effects and camera. **React DOM for the shell:** top bar, death card, Death Board, speech bubbles, pause menu and the desktop-only screen.

## Layout

```text
src/
  main.tsx
  components/      React shell
    App.tsx          desktop gate, top bar, pause
    GameCanvas.tsx   fixed-step loop and canvas sizing
    DesktopOnly.tsx  "desktop experience" screen
    Icon.tsx
  game/            simulation, free of React and DOM
    balance.ts       tunables
    simulation.ts    state, commands, tick, player, grab and throw, props
    physics.ts       box-versus-tile collision, one-way surfaces, isFree()
    level/level.ts   tile legend, Level type, parseLevel() and the Grid builder
    level/block.ts   the authored block (112 × 33 tiles)
    sound.ts         optional Web Audio adapter (the one DOM-touching game file)
  platform/        browser capability checks
    device.ts        isDesktop() and the override
  rendering/       Canvas drawing
    drawWorld.ts     camera, sky and parallax skyline, tiles, decor, props, android
    pixels.ts        brush, sprite, glow, android sprite and walk poses
  styles/main.css
  tests/
```

Files planned for later chunks:

| Chunk | Files |
| --- | --- |
| 2 | `game/data/deaths.ts` (death registry and predicates), `components/DeathCard.tsx`, `components/DeathBoard.tsx` |
| 3 | `game/data/neighbours.ts` (state-keyed lines), `components/SpeechBubble.tsx` |
| 4 | `game/twist.ts`, `game/save.ts` |

## State and commands

`keyboard → typed command → simulation validates → next state + events → Canvas and React render`

- **Game state:** the player (position, velocity, facing, grounded, held entity), props, corpses, hazard states, unlocked deaths and repeat counts, the attempt count, neighbour memory flags, twist state and the tick clock.
- **Commands:** `move` (direction pressed or released, with a key source), `jump` (pressed or released), `grab` and `clear` exist now. `interact` and `skipCard` arrive in Chunk 2. The simulation rejects any command that is invalid in the current state.
- **Events:** `death`, `respawn`, `award`, `speech` and `twistStep`. React and audio subscribe to events and never read per-frame state.
- **Loop:** `requestAnimationFrame` is the clock. The simulation advances in fixed 60 Hz steps and clamps long frames. The loop pauses for menus, a hidden tab and a blurred window.
- **Determinism:** the same starting state and the same command sequence must produce the same result. Tests drive full journeys with scripted input rather than injecting state.

## Physics

- Hand-rolled axis-aligned boxes against a tile grid: horizontal movement resolves first, then vertical.
- Bodies never rotate. Corpse poses are sprite variants with their own box sizes.
- Props and bodies are solid from above only. Stacking is stable because loose bodies resolve in order from the bottom up each tick and snap onto the surface below.
- Speeds are capped so nothing travels more than 0.37 tiles per tick. One leading-edge check per axis therefore can't skip a tile.
- If stacking proves unworkable, measure first before adding a library.

## Saved state (Chunk 4)

- One versioned local save payload holding the attempt count, unlocked deaths, repeat counts, corpses, neighbour memory flags and twist state.
- Validate it on load and fall back to a fresh game on any mismatch. Wrap every storage access in try/catch.

## Desktop gate

`platform/device.ts` treats a device as desktop unless it has a coarse pointer with no hover, or a viewport narrower than 720 px. Visitors can choose **Try anyway**, or use `?desktop=1`. The override lasts for the browser session.

## Accessibility and performance

- Visible focus, labelled buttons, reduced-motion support (no wobble, sway or screen shake), audio muted by default, and Esc to pause from anywhere.
- Death cards are announced through a polite live region.
- Device-pixel-ratio-aware canvas sizing. The world redraws every frame while the DOM updates only on events.

## Commands

`npm ci`, `npm run dev`, `npm run typecheck`, `npm run test`, `npm run build`, `npm run preview`.

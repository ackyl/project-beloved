# Project Beloved

A desktop 2D sandbox platformer about a cheerful android that read **"ONLY HUMANS DIE"** on a torn scrap of paper and is now very scientifically trying to become human. Its replicator keeps printing new copies. The old bodies stay where they fell. The neighbours have opinions.

> **Status:** early development. Chunks 0 and 1 are done: you can walk, jump, climb and throw things around the block. Nothing can die yet. See [the implementation plan](docs/IMPLEMENTATION_PLAN.md) and [the development status](docs/DEVELOPMENT_STATUS.md).

## Run locally

Use Node 22.12+ on the 22.x line, Node 24.x, or Node 26+.

```sh
npm ci
npm run dev
```

The game is desktop only. Narrow windows and touch-only devices show a "desktop experience" screen. Add `?desktop=1` to the URL to bypass it while testing.

## Controls

| Action | Keyboard | Available |
| --- | --- | --- |
| Pause | Esc | Now |
| Walk | A/D or left/right arrows | Now |
| Climb ladders, drop through platforms | W/S or up/down arrows | Now |
| Jump | Space or K | Now |
| Grab, throw | Shift or J. Hold W to throw high, S to set down. | Now |
| Interact | E | Chunk 2 |
| Death Board | Tab | Chunk 2 |

Audio starts muted.

## Docs

- [Game design](docs/GAME_DESIGN.md): concept, pillars, tone guardrail, the block, the neighbours and the twist.
- [Mechanics](docs/MECHANICS.md): movement, death and replication, corpses and the Death Board list.
- [Visual direction](docs/VISUAL_DIRECTION.md): palette and feel.
- [Architecture](docs/ARCHITECTURE.md): code layout, state and commands, physics.

The previous game in this repository, *Below, Beloved*, is preserved in git history at commit `ca6f8c1`.

## Verify and deploy

```sh
npm run typecheck
npm run test
npm run build
npm run preview
```

For Vercel, select the Vite preset, use `npm run build`, and publish `dist/`.

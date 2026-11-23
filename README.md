# Project Beloved

A 2D sandbox platformer about a cheerful android that read **"ONLY HUMANS DIE"** on a torn scrap of paper and is now very scientifically trying to become human. Its replicator keeps printing new copies. The old bodies stay where they fell. The neighbours have opinions.

> **Status:** the v0.2 slice is playable end to end. It has 20 deaths to find, old bodies you can stack, four neighbours, the twist and local save. The block is rendered as a sci-fi city in pixel art. See [the implementation plan](docs/IMPLEMENTATION_PLAN.md) and [the development status](docs/DEVELOPMENT_STATUS.md).

## Run locally

Use Node 22.12+ on the 22.x line, Node 24.x, or Node 26+.

```sh
npm ci
npm run dev
```

The same game runs on desktop and mobile. Touch controls appear on touch-only devices and in narrow windows.

## Controls

On mobile, use the right D-pad to walk, jump and climb. The left buttons grab or throw objects and talk to neighbours or use nearby objects. Hold Up or Down on the D-pad while throwing to throw high or set the item down.

| Action | Keyboard | Available |
| --- | --- | --- |
| Pause | Esc | Now |
| Walk | ← / → | Now |
| Jump or climb a nearby ladder | ↑ | Now |
| Climb down or drop through a platform | ↓ | Now |
| Grab or throw | Q. Use ↑ + Q to throw high or ↓ + Q to set down. | Now |
| Use, talk | E | Now |
| Death Board | Tab | Now |
| Skip to the replicator | ↑, Q or E while dead | Now |

The two-page intro opens automatically once per browser. Open it again from Pause. Audio starts muted. Progress saves in the browser. **Start over…** in the pause menu erases it.

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

# Below, Beloved

A browser-playable side-view mining game. Float out of a warm sanctuary, dig through the Quiet Hollow, and bring something back for the human behind the curtain.

## Run locally

Use Node 22.12+ on the 22.x line, Node 24.x, or Node 26+. The verification machine used Node 24.14.1.

```sh
npm ci
npm run dev
```

## Controls

| Action | Keyboard | Touch |
| --- | --- | --- |
| Float and excavate | Hold WASD or an arrow key | Hold a direction on the pad |
| Collect | Move into an exposed drop | Same |
| Open the sanctuary console | E near home | Tap Console |
| Unseal the medical annex | Hold E at the entrance | Hold Unseal |
| Read discoveries | J | Tap the field log |
| Pause, change motion settings, or restart | Esc | Tap pause |

The last direction pressed takes priority. Release it to resume an earlier held direction. Float into a wall to strike it repeatedly. Earth takes one hit, stone and copper take two, and prism takes three. The depth, local scan, objective bearing and distance help with orientation. Audio starts muted.

The bloom has its own inventory pocket. Minerals that do not fit stay where they fell. The sanctuary has a mineral locker and a two-slot pack extension. Two tests at the console provide the clues for a treatment. A wrong inference preserves the sample. Once a dose is prepared, select Care at the closed curtain.

The simulation and care clock stop during menus and when the game loses focus. Care needs recur, and the living culture can supply subsequent doses. Progress lasts for the current page session. Restart accepts an unsigned 32-bit seed, including zero. The default is 1703.

## Implementation

- `src/game/` owns a deterministic finite 72 × 43 tile world, material durability, contact mining, pickups, inventory, the sealed panel, research and care. A fixed 60 Hz simulation consumes typed commands. Timing and capacity values live in `balance.ts`.
- `src/rendering/` draws the side-view scene, camera, destructible terrain, sprites, lighting and feedback with Canvas 2D. It caches terrain and repaints affected neighborhoods when a tile changes. The panorama, shale texture and sanctuary art ship locally in `public/art/`.
- `src/components/` provides keyboard and touch input, HUD, local scan, field log, settings and sanctuary interactions. DOM updates follow changes visible to the HUD. The simulation has no React or browser dependencies. The optional Web Audio adapter synthesizes short cues.
- Barlow and Space Mono are bundled locally with their licenses in `public/fonts/`.

## Verify and deploy

```sh
npm run typecheck
npm run test
npm run build
npm run preview
```

For Vercel, select the Vite preset, use `npm run build`, and publish `dist/`. The root route and all game assets are static. See [the verification log](docs/DEVELOPMENT_STATUS.md) for tested environments and limitations.

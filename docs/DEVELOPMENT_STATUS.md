# Project Beloved — development status

**Chunk 1 (platformer core) is complete.** Verified on November 23, 2026.

The previous game, *Below, Beloved* (a mining and care vertical slice), was completed and verified at commit `ca6f8c1`. Its code, tests, art and verification log remain in git history.

## Milestones

| Chunk | Delivered | Gate |
| --- | --- | --- |
| 0. Pivot and cleanup | Rename, rewritten docs, mining code removed, placeholder street, pause, audio toggle, desktop-only gate | Typecheck, 9 tests and build passed. Checked in the browser. |
| 3. The block and the neighbours | E interactions with prompts, the four neighbours with state-keyed lines, speech bubbles and reactions to deaths they see, Pell's crumbs, the crane magnet, the tipping vending machine, the washing-line zip, the planter, the mirrors' focus, Juniper's drip, the power line, Pell's bowls, boredom and the Died of Embarrassment bonus. All 20 board deaths are reachable. | Typecheck, 85 tests and build passed. Talked to Pell in the browser. |
| 2. Death, corpses and the Death Board | Death events and classification, corpses with poses and tints that stay where they fall and can be carried, stacked and stood on, the 40-body cap with Bas carting the oldest away, replicator respawn with a printing effect (under 3 s, skippable), death cards with Rook's ratings, the Death Board overlay (Tab), the tram, the compactor, the canal and the fryer. Wired deaths: Gravity Research, Mind the Gap, Compacted, Deep Fried, Not Waterproof, Self-Inflicted, Two for One and Group Hug. | Typecheck, 62 tests and build passed. Died in the canal in the browser; card, board and counters updated. |
| 1. Platformer core | Tile collision, walking, variable jump with coyote time and buffering, ladders, one-way platforms, drop-through, following camera, and grabbing, carrying, throwing and setting down props. The block is roughed in. | Typecheck, 40 tests and build passed. Played with keyboard events in the browser. |

## Chunk 1 details

- **The block** (112 × 33 tiles) is roughed in: the walk-up (ground-floor flat with the replicator and Death Board, floor 2, and a roof with a water tank and climbable antenna), a fire escape, the west street with the tram shelter, the east street with the dumpster, noodle cart, vending machine and shack, and the scrapyard with a fence, scrap piles, the compactor pit and the crane gantry. Decor is placeholder art drawn in code. No hazards are active yet.
- **The building is a cutaway**, so you see into the rooms from the side.
- **Props:** crates, pots and tires. They are solid from above only, so they stack and you can stand on them. See `MECHANICS.md` for the rule and the tunables.
- **Controls legend** at the bottom left of the screen.

## Verification

| Check | Result |
| --- | --- |
| `npm run typecheck` | Passed under strict TypeScript. |
| `npm run test` | 40 tests in 4 files passed. They cover the desktop gate; walking, the most-recent-direction rule, walls and clearing input; jump height, short hops, coyote time and jump buffering; one-way platforms and drop-through; climbing ladders and jumping off them; no tunnelling at maximum speed; determinism; grabbing, nearest-prop choice, forward, high and set-down throws; placement against walls and under low ceilings; stacking, standing on crates and collapsing stacks; a scripted journey from the flat to the top of the antenna; and seeded random-input runs (7 seeds, up to 6,000 ticks) that assert nothing ever ends up inside a tile. |
| `npm run build` | Produced a static build. JS measured 79.02 kB gzip and CSS 1.26 kB gzip. |
| Built-in browser, 1365 × 820, dev server | Keyboard events walked the android to the crate, grabbed it, threw it while jumping, then walked to the ladder and climbed to floor 2. The camera followed. A fresh page load produced no errors. |

## Known limits

- Movement feel has not been playtested by a human. All tunables are first guesses.
- Props pass through the player sideways by design. This may need a visual cue later.
- The bottom-left controls legend overlaps the street at small window heights.
- Placeholder art throughout. Some mid-ground skyline colours sit close to the building's brick.
- No physical phone or tablet testing for the desktop gate. Sound output was not checked.

## Next

Chunk 2: death, corpses and the Death Board. See `IMPLEMENTATION_PLAN.md`.

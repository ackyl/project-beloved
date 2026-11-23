# Project Beloved — development status

**The v0.2 slice is complete (Chunks 0–4).** Verified on November 23, 2026.

The previous game, *Below, Beloved* (a mining and care vertical slice), was completed and verified at commit `ca6f8c1`. Its code, tests, art and verification log remain in git history.

## Milestones

| Chunk | Delivered | Gate |
| --- | --- | --- |
| 0. Pivot and cleanup | Rename, rewritten docs, mining code removed, pause, audio toggle, desktop-only gate | Typecheck, tests and build passed. Checked in the browser. |
| 1. Platformer core | Tile collision, walking, variable jump with coyote time and buffering, ladders, one-way platforms, drop-through, camera, and grabbing, carrying, throwing and stacking props. The block is roughed in. | Typecheck, 40 tests and build passed. Played with keyboard events. |
| 2. Death, corpses and the Death Board | Death classification, persistent bodies with poses and tints, the 40-body cap with Bas carting the oldest away, replicator respawn with a printing effect (under 3 s, skippable), death cards, the Death Board overlay, tram, compactor, canal, fryer, falls and bonks | Typecheck, 62 tests and build passed. Died in the canal in the browser. |
| 3. The block and the neighbours | E interactions with prompts, four neighbours with state-keyed lines, speech bubbles and reactions, crane, vending machine, washing-line zip, planter, mirrors, drip, power line, Pell's bowls, pigeons, boredom, and Died of Embarrassment. All 20 deaths are reachable. | Typecheck, 85 tests and build passed. Talked to Pell in the browser. |
| 4. Twist, save and feel | Feedstock low, the dark rebuild, permanent mismatched parts, Rook's paper, #21 Died Laughing, the rooftop party, local save with validation, Start over, and sound cues | Typecheck, 94 tests and build passed. Played through the twist in the browser and checked the production build. |

## Verification

| Check | Result |
| --- | --- |
| `npm run typecheck` | Passed under strict TypeScript. |
| `npm run test` | 94 tests in 7 files passed. Every death has a test. Most are reached purely through game input: movement, grab and E. Self-Inflicted and Two for One create their first old body by dying, then use input. Group Hug and Stairway to Heaven place the bodies directly, and Died of Embarrassment calls the kill path at the right spot. Tests also cover movement feel rules, props and stacking, the death cycle and its 3-second limit, repeats and uncatalogued deaths, the body cap, the twist sequence, save round-trips, corrupt or old saves, throwing storage, and seeded random-input runs asserting nothing ever ends up inside a wall. |
| `npm run build` | Static build: JS 95.94 kB gzip, CSS 2.27 kB gzip. |
| Dev server, 1365 × 820 | Keyboard events: died in the canal (card, sparks, wet body, counters), opened and closed the Death Board, walked to Pell, talked and received crumbs (prompt and speech bubble). |
| Twist in the dev server, 1365 × 820 | Seeded a save one death before the dark. Died in the canal and the dark sequence played with all four neighbours' lines. The android respawned rebuilt. Read Rook's paper at the corkboard: the reveal dialog, the #21 card, rooftop bunting, confetti and "Human: provisionally" all appeared. |
| Production preview, 1920 × 1080 | Loaded with no errors, no failed requests and no horizontal overflow. |
| Production preview, emulated touch phone 375 × 812 | The desktop-only screen appeared. No horizontal overflow. |

## Known limits

- **Not playtested by a person.** All tunables, the twist threshold (12 unique deaths), and the joke and line writing are first drafts.
- **Not played from scratch in a browser.** The full natural run to the twist (12 different deaths) was only covered by automated tests. The browser check started from a seeded save.
- **Placeholder art throughout.** It is drawn in code: neighbours are simple pixel figures, and the corpse sprites are rough.
- **Bas carting bodies away** shows only as a speech bubble. There is no cart animation.
- **Audio** is basic synthesized cues. Audible output was not checked, only that nothing errors.
- **Speech bubbles** follow neighbours but can overlap each other or the death card when several people talk at once.
- **No physical devices.** Phones and tablets were not tested, and neither were Firefox or Safari.
- **The Chunk 3 commit (`d9c02ee`) has the vending machine missing its E interaction.** The Chunk 4 commit fixes it.

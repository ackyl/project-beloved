# PROJECT BELOVED — IMPLEMENTATION PLAN

**Goal:** a playable desktop slice of one block, with 20 authored deaths, persistent physical corpses, four neighbours and the twist.
Each chunk ends with `npm run typecheck`, `npm run test` and `npm run build` passing. Do not advance while critical defects remain.

## Chunk 0: Pivot and cleanup ✅

Rename the project to Project Beloved. Rewrite the design docs. Remove the mining code, tests and art. Ship a running shell with a placeholder street, the pause menu, the audio toggle and the desktop-only gate.

## Chunk 1: Platformer core ✅

Tilemap and collision, walking and jumping (with coyote time and a jump buffer), ladders, one-way platforms, a camera that follows the player, and grabbing, carrying, dropping and throwing props. Build it in a test room first, then rough in the block's layout.
**Tests:** jump arc and coyote window; no tunnelling through tiles at maximum speed; throw trajectories are deterministic; a dropped prop never ends up inside a tile; the most recently pressed direction wins.
**Acceptance:** moving around is fun in an empty room with keyboard only.

## Chunk 2: Death, corpses and the Death Board ✅

Hazard events, the freeze-and-sparks transition, corpse entities (stacking, grabbing, standing on them, and the cap with Bas's cart), the replicator respawn, the death card, the Death Board overlay and the first 8 deaths.
**Tests:** each death predicate fires exactly for its setup; repeats don't re-award; a 5-corpse stack is stable and climbable; the death-to-respawn cycle takes at most 3 s.

## Chunk 3: The block and the neighbours ✅

The authored Building, Street and Scrapyard; four neighbours with state-keyed lines; Rook's ratings and hints; and the remaining 12 deaths, including the corpse-based and secret ones.
**Tests:** every death is reachable from spawn, using simulated journeys driven by scripted input; neighbour lines resolve for every state.

## Chunk 4: Twist, save and feel ✅

The feedstock and twist sequence, the permanent mismatched parts, the Died Laughing card and the rooftop party; local save; audio (death stingers, the replicator ding, ambient street sounds); and a polish pass.
**Tests:** the twist fires once at the threshold; a save round-trip matches the live state; a corrupt or old save falls back cleanly; storage that throws doesn't break play.
**Verification:** a full playthrough to the twist at 1365 × 820 and 1920 × 1080, and a check of the desktop gate at 390 × 844. Update `DEVELOPMENT_STATUS.md` with measured results.

## Quality gates

- The player sees a game scene, not a dashboard.
- The simulation is authoritative and deterministic. Invalid commands cannot change state.
- No missing assets, stuck input or broken overlay transitions.
- Deaths stay slapstick and specific to the city (see the tone guardrail in `GAME_DESIGN.md`).
- Avoid feature creep: no combat, no fail state, no procedural levels and no touch controls in this slice.

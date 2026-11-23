# BELOW, BELOVED — MECHANICS

**Status:** Intended rules for the first prototype. Exact numeric values below are **initial tunables**, not canonical final balancing. Keep centrally configurable and document deviations after implementation.

## Movement and mining

- 2D side-view visual perspective. Four-direction free float movement through open cells; no gravity, jump, platforming, inertia requirement, or physics engine.
- **Dome Keeper-style contact mining:** holding a direction into a solid adjacent tile repeatedly strikes that tile instead of moving through it. When durability reaches zero, tile breaks, yields its drop where applicable, and movement continues into the opened cell if direction remains held. Do not make click-to-mine the main interaction.
- One-hit soft earth; two-hit compact stone; three-hit crystal-bearing rock as initial reference values. Each held-contact strike happens at a fixed interval, e.g. 160–220 ms, tuned for feel. Provide a distinct impact response, hit progress, and break effect. Avoid per-frame hits.
- Only one target tile per directional contact; no area-of-effect excavators in first slice. On simultaneous direction keys, resolve consistently (e.g. most recently pressed direction wins); document rule.
- Base room and authored landmark structures should be protected from indiscriminate mining unless a deliberately marked excavation tile is part of the discovery.
- For touch: a visible 4-direction control pad, with hold-to-move/contact-mine. Pointer cancel/release must reliably stop motion. Keyboard: WASD/arrows.
- The android's collision size should fit one open tile; camera follows smoothly and never conceals the immediate tile being mined.

## World and discovery

- Seeded procedural world with deterministic chunks or a finite generously sized prototype region. "Infinite" scale is an atmosphere goal, not a requirement for streaming endless terrain in v0.1.
- Preserve accessible routes to the authored annex and required treatment resources for every valid test seed. Ensure the starting region provides a path into mineable terrain and a reliable return path.
- Distinguish common resource tiles, structural boundary tiles, collectible specimen fixtures, and authored environmental landmarks.
- An annex discovery must require actual exploration and a small context-sensitive **hold interaction** (e.g. hold E / touch interact for ~0.7s to open an old panel), not just a menu click. Hold interactions are for fixtures, sample extraction, or sealed panels, **not** ordinary mining.
- Environmental clues use silhouettes, equipment, light, sounds, and brief android observations. No long log exposition.

## Inventory and collection

- Start with modest capacity (example: 8 units). Materials occupy slots by count; specimens occupy their own slots. Inventory remains readable on mobile.
- Collect exposed items on contact or with a nearby short interaction, consistently chosen and taught. No physics item juggling.
- Do not allow softlocks due to full inventory: uncollected drops persist where feasible, and critical specimen acquisition must be recoverable.
- Return-to-base path must stay open; no oxygen or stamina pressure.

## Research: property deduction

- Research happens at a simple base console, not a complex laboratory room.
- A specimen has hidden, *consistent* properties. The player performs a small fixed set of tests (e.g. resonance response, chemical reaction) and receives readable observations.
- Initial target puzzle: deduce whether the luminous specimen has the **resonant** and **restorative** properties needed for a breathing-support treatment. Each test reveals one clue; the player selects/infer a treatment formula from presented hypotheses. Wrong hypothesis yields informative feedback, does not consume the only critical sample, and does not permanently damage the human.
- Limit first slice to 1 meaningful specimen, 2 tests, 2–3 hypotheses, and 1 treatment. Other collectibles serve mining/upgrades/visual discovery and need not all be researchable.
- Test results must be stable for the same specimen/seed. Make the reasoning legible; no random recipe success.

## Care system

- Patient is never directly visible. The base shows a curtain, a simple monitor or soft audio from behind it, and a care interface.
- Gentle periodic care need advances with meaningful in-game elapsed time or excavation actions. The patient may become "Needs attention" but **never dies, ends the run, or makes exploration impossible**.
- Treatment must be created via research, administered via the care interface, and lead to a distinct response (e.g. breathing steadies + unexpected resonance). No permanent failure path.
- Patient status is clearly communicated without a constantly alarming timer.

## Upgrades

- One optional minor upgrade earned from common ore, e.g. +2 inventory capacity or modest strike interval improvement. It should be visibly useful but not gate the revelation. No upgrade tree.

## One complete playable slice

Start in base → move into cave → mine soft and hard blocks → collect ordinary ore and luminous specimen → encounter sealed annex panel and hold to open → observe eerie detail → return home → perform two tests → infer and create breathing treatment → administer behind curtain → observe patient response and linked specimen sound → continue digging or restart.

## Failure and edge cases

- Invalid commands, out-of-range interaction, insufficient ingredients, full inventory, and repeated care actions cannot corrupt state.
- No death/game-over in first slice. Include explicit restart and seed reset; deterministic seed + ordered commands should reproduce results.
- Pause game simulation while app/tab inactive; clamp long frames on resume.

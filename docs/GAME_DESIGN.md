# BELOW, BELOVED — GAME DESIGN

**Status:** Prototype specification, v0.1. **Working title:** Below, Beloved.

## Concept

A gentle maintenance android excavates the remains of an abandoned underground civilization, seeking treatments for the unseen human in its care. The android experiences the luminous, unsettling underground ecosystem as beautiful; the player gradually recognizes the horror in those same discoveries.

**X, but Y:** *Dome Keeper*'s tactile directional mining meets *SIGNALIS*'s environmental unease, but the protagonist sees wonder rather than terror, and the objective is care rather than combat.

## Experience pillars

1. **Digging is intrinsically pleasant.** Four-direction floating movement and contact-based mining feel responsive, even between discoveries.
2. **Curiosity drives progress.** Strange geology and specimens reward exploration and experimentation, not combat.
3. **Comfort against dread.** The compact warm android base contrasts with huge, silent caverns. Dread comes from environmental implications, never jumpscares.
4. **Care without punishment.** The human needs periodic treatment, but neglect never causes death, a game over, or a hard time limit.
5. **Small interactions, meaningful revelations.** A specimen can matter as an object to gather, a property to deduce, a treatment component, and a story clue.

## Core loop

Leave base → Float and mine into the cave → Find and collect specimens → Return to base → Run tests / infer treatment → Care for unseen human → Observe a change → Explore farther.

## Prototype boundaries

**First deliverable: one playable vertical slice** containing:
- One contiguous, seeded, destructible 2D cave with an accessible starting area.
- One small, warm android base with a curtain separating the player from the unseen patient. Never reveal a bed or patient sprite.
- 4-direction float movement, directional collision-mining, and terrain with varying hit requirements.
- A basic inventory, two collectible material types and one meaningful biological specimen.
- A compact, understandable property-testing and recipe-deduction interaction.
- Periodic, non-lethal care need; one treatment and a visible/audible response from beyond the curtain.
- One handcrafted narrative location integrated into procedural terrain, leading to one environmental revelation.
- Clear onboarding and a repeatable loop; no need for complete story or full progression.

**Explicitly excluded:** combat, enemies, jumping, gravity, hunger, health-based failure, extensive crafting, farms, freeform base building, extensive dialogue trees, backend, login, economy, multiple biomes, complex ecosystem simulation.

## Story treatment

The android is curious, competent, gently affectionate, and not stupid. It describes objectively disturbing details in clinical or delighted language without making the game a comedy. The patient is an unseen presence behind a curtain; communicate through monitor changes, subtle audio, and occasional short response. In this prototype, do **not** explain why civilization fell, who the patient is, or what the ecosystem ultimately means.

### One authored revelation (proposed for the slice)

A luminous root/fungal specimen seems helpful for the patient's respiratory symptoms. Deep in an abandoned treatment annex, the player finds the same growth intertwined with old patient support hardware. The android describes the organism's unusual efficiency and beauty. Back at base, the human responds to the treated sample's distinct rhythmic sound. Present a disturbing connection but no definitive answer. This is a prototype narrative beat, not a locked final-world explanation.

## Success criteria

The slice is successful if: (1) mining is enjoyable without story triggers, (2) the player understands differences in terrain hardness, (3) they can deliberately find and collect a specimen, (4) they can infer a treatment from test results instead of guessing blindly, (5) they can administer it and observe a non-lethal condition change, and (6) the single revelation makes the player reconsider a prior beautiful discovery.

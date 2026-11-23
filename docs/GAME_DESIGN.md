# PROJECT BELOVED — GAME DESIGN

**Status:** v0.2 slice implemented (Chunks 0–4). It replaces the v0.1 mining slice *Below, Beloved*, which remains in git history at `ca6f8c1`.
**Genre:** 2D side-view sandbox platformer. Absurdist comedy with a heartwarming core.
**Platform:** Desktop and mobile browsers with keyboard or touch controls.

## Logline

A cheerful maintenance android finds a torn scrap of paper that reads **"ONLY HUMANS DIE."** It wants to be human, so it does the logical thing: it dies. Its replicator pod disagrees, and every time it prints a fresh copy. The old body stays exactly where it fell, stiff as a board. The neighbours have opinions.

## Pillars

1. **Dying is the verb, and it's funny.** Each new way to die is a small discovery. It earns a card on the Death Board and a line in the android's research log, for example: *"Attempt 37: still not human. Learned: pigeons are a community."*
2. **Your past is physical.** Every body stays. You can grab it, throw it, stack it, or use it as a doorstop, a counterweight or a ladder. Some deaths are only reachable by standing on your previous selves.
3. **A neighbourhood that notices.** Four residents react to your deaths, remember them and slowly change how they treat you. The twist is built from what they have been quietly doing.
4. **Dumpster-cozy, never grim.** The setting is a sun-bleached slum with solar panels, laundry lines, rooftop gardens, rust and patched tarps. There is no neon and no gore. Deaths are sparks, loose bolts, a comic sound and a stiff pose.
5. **Endless by design.** There is no fail state. Completing the Death Board is the long goal. The twist lands partway through, and play continues afterwards.

## Tone guardrail

Deaths are slapstick, environmental and specific to this city: trams, compactors, pigeons, fryers, solar mirrors. They never imitate real-world self-harm methods, such as ropes, pills or blades. The joke is always the android's sincere, wrong-headed science. The neighbours' warmth carries the emotional weight.

## The slice: one block

A small playable area, about 4–5 screens wide and 3 screens tall. The level is a hand-authored tilemap, not procedural, so that the death setups can be designed.

| Area | Contents |
| --- | --- |
| **The Building**, a 3-floor walk-up | **Ground:** the android's flat, with the **Replicator pod** where you respawn and the **Death Board**, a corkboard of polaroids. **Floor 2:** neighbours' flats and a shared stairwell with a ladder. **Roof:** solar panels, Juniper's planters, a water tank, an antenna and pigeons. |
| **The Street** | Auntie Pell's noodle cart, a tipsy vending machine, a market power strip, a tram line with a stop, laundry lines strung between buildings, and a canal grate. |
| **The Scrapyard** | Bas's yard, with a magnet crane, a trash compactor and the solar mirror array. |

## Neighbours

| Name | Who | Role in play | Role in the twist |
| --- | --- | --- | --- |
| **Auntie Pell** | Runs the noodle cart. Feeds you anyway ("you look thin"). | Sets up kitchen deaths. Keeps a tally on her chalkboard. | Donates her pots. |
| **Rook** | A kid with a notebook who rates every death out of five stars. | Gives cryptic hints for locked Death Board slots. Says "boring" when you repeat a death. | Pins up the other half of the torn paper. |
| **Bas** | The grumpy scrapyard keeper. | Runs the crane and the compactor. Carts away your oldest bodies "for scrap". | Has been feeding your bodies, and later his own things, into the replicator. |
| **Juniper** | A rooftop gardener and the solarpunk heart of the block. | Runs the irrigation and the planters. Unbothered by anything. | Grows something from your spare parts. |

Their lines are short and state-driven. They change with the attempt count, specific deaths and twist progress. There are no dialogue trees.

## The twist (implemented as drafted; open to revision)

**Setup, which runs throughout the game:**
- Bas keeps carting old bodies away.
- Rook keeps rating your deaths, and his ratings get kinder.
- Pell's pots start disappearing.
- Juniper's planter grows a sprout with a tiny bolt for a leaf.

**Trigger:** after 12 unique deaths, the replicator starts to sputter: *"FEEDSTOCK LOW."* Bas grumbles that he's "out of you." The android is thrilled. Surely the next death will finally stick.

**The beat:**
1. The next death plays out with no ding. The screen goes black, and you hear only the neighbours' muffled voices, arguing and clanking.
2. The android wakes up rebuilt, mismatched: a pot-lid cheek from Pell, a toy arm from Rook and a sprouting shoulder from Juniper. These changes are permanent and cosmetic. Bas had been feeding your old bodies into the replicator all along, and when they ran out, the neighbours gave their own things.
3. Pinned to the Death Board is the **other half of the torn paper**, put there by Rook. It's a page from his school poster, *Things Only Humans Do*. The full line reads: **"ONLY HUMANS DIE LAUGHING."**
4. The android realises that every one of its deaths had the whole block dying laughing. For the first time, it laughs too.
5. A final card appears: **#21 Died Laughing.** *"Not technically a death. Human: provisionally confirmed."* The block throws a small rooftop party.

**After the twist:** play continues. The replicator runs on community scrap now. The remaining deaths are still there to find, and the neighbours' lines shift to fond, teasing ones.

## Out of scope for this slice

Combat, enemies, health bars, timers or any fail state, procedural levels, dialogue trees, crafting trees, multiple districts, online features and accounts.

## Success criteria

1. Walking, jumping and throwing feel good with nothing dying.
2. A new player discovers their first death within about 30 seconds, and their first corpse-based death without being told.
3. Players laugh at death cards and go back to check hints on the Death Board.
4. At least one playtester feels genuinely warm at the twist, not just amused.
5. After the twist, players keep hunting for the remaining deaths.

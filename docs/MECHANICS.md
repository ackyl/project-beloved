# PROJECT BELOVED — MECHANICS

**Status:** Intended rules for v0.2. Numbers are starting tunables. Keep them in `src/game/balance.ts` and record any changes after implementation.

## Movement and interaction

- Side-view platformer with gravity. Walk, jump (with about 0.1 s of coyote time and a jump buffer), climb ladders, and drop through one-way platforms by pressing down.
- **Grab (Q):** pick up the nearest prop or body in front of you (or under your feet), carry it above your head, then throw it or set it down. Grab again to throw forward. Use Up + Q to throw high or Down + Q to set it down at your feet. Throws follow deterministic arcs.
- **Props and bodies are solid from above only.** You and other props can stand and stack on them, but you walk through them sideways and they fall through you. This keeps stacking stable and avoids pushing physics. Take something away from the bottom of a stack and everything above it falls.
- **Dropping below you:** in the air, use Down + Q to drop what you carry straight under your feet, then land on it. That is how towers of old bodies get built.
- **Placement is always valid.** A released prop goes to the first free spot: where it was carried (when throwing) or in front of your feet (when setting down). If that spot is blocked, it goes inside your own box, which is always free.
- **Interact (E):** talk to neighbours and use objects like the vending machine, crane controls, fryer or replicator.
- **Controls:** Left and Right to walk, Up to jump or climb, Down to climb down or drop through a platform, Q to grab or throw, E to interact, Tab for the Death Board, Esc to pause. On mobile, the right D-pad supplies the arrow directions and the left buttons supply Grab / Throw and Use.
- When two opposing directions are held, the most recently pressed one wins. Releasing it resumes the other.
- **Ladders:** press Up beside a ladder or Down at its top to climb. The top of a ladder works as a one-way platform. Release Up or Down and press Left or Right to let go.

### Implemented tunables (Chunk 1)

| Value | Setting |
| --- | --- |
| Walk speed | 6.5 tiles/s, reached in about 0.09 s on the ground |
| Jump | 21 tiles/s launch, 60 tiles/s² gravity, apex about 3.7 tiles. Releasing early cuts upward speed to 45%. |
| Coyote time and jump buffer | 6 ticks (0.10 s) and 7 ticks (0.12 s) |
| Climb speed | 5 tiles/s |
| Speed caps | 18 tiles/s falling and sideways, 22 tiles/s rising, so nothing moves more than 0.37 tiles per tick |
| Player box | 0.7 × 1.15 tiles |
| Props | crate 0.7 × 0.7, pot 0.55 × 0.55, tire 0.7 × 0.45 |
| Throws | forward 10 tiles/s out and 7 up, plus half your walking speed. High throw: 3 out and 15 up. |

## Death and replication

1. A hazard fires a typed **death event** (`{ cause, context }`). The context includes things like what you were holding, fall height, wetness and which neighbours can see you.
2. The android freezes in its current pose, and sparks and bolts pop out. The live player becomes a **Corpse** entity.
3. A **death card** slides in: either *NEW: Deep Fried* with a joke line and Rook's star rating, or *Repeat: Mind the Gap ×4* with "boring."
4. The replicator dings and a fresh copy steps out of the pod. **The whole cycle takes 3 s or less and can be skipped** with any action key.

Every death increments the attempt counter shown in the top bar.

## Corpses

- A corpse is a rigid, axis-aligned body with gravity and friction. It can be stacked, grabbed and thrown, stood on, and pressed onto buttons or pressure plates.
- Bodies don't rotate in the physics. Each corpse keeps one of a few stiff pose sprites (upright, flat or upside-down) that matches how it died, and the pose sets its collision box.
- There is a cap of about 40 corpses. When it's reached, Bas wheels the oldest away in a cart. This is visible and comic, and it sets up the twist.
- Corpses persist across sessions through local save.

## The Death Board (authored list)

- Deaths are a hand-written registry (`src/game/data/deaths.ts`). Each entry has an id, a name, a joke line, the android's "learned" log line, Rook's hint, a star rating and a **trigger predicate** over the death event. The first match wins, and specific combinations are checked before the general causes they refine.
- A death is awarded once. Later repeats only add to its repeat count. A death that matches nothing still counts as an attempt, and Rook says it doesn't count.
- Locked slots show Rook's hint. Slots that need old bodies say so.
- The board has **20 deaths** plus the twist's #21. Every one has a test (see `DEVELOPMENT_STATUS.md`).

| # | Death | How it happens in the block | Needs bodies? |
| --- | --- | --- | --- |
| 1 | **Gravity Research** | Any fall of 7.5 tiles or more, for example off the fire escape landing or the antenna | |
| 2 | **Mind the Gap** | Be in the tram's path on the west street while it moves. It first arrives after about 5 s, waits 4 s at the stop, and comes back about every 18 s. You can stand on its roof while it waits. | |
| 3 | **Compacted** | Be in Bas's compactor pit when it slams (about every 10 s, or sooner if you press its button with E) | |
| 4 | **Deep Fried** | Fall into the fryer on Pell's cart. Jumping beside the cart, or walking off the dumpster lid, does it. | |
| 5 | **Not Waterproof** | Walk into the canal on the west street | |
| 6 | **Vending Machine Revenge** | Shake the vending machine with E four times. It tips towards you. | |
| 7 | **Overclocked** | E at the power strip outside the building's east door | |
| 8 | **Solar Flair** | Stand in the mirrors' focus on top of the scrap pile for about 1.7 s | |
| 9 | **Crane Game** | Stand under the magnet crane's pickup spot. It lifts you and drops you over the scrap pile. Falls of 3.5 tiles or more after a magnet ride are fatal. | |
| 10 | **Rusted Through** | Stand under Juniper's drip on the roof for 4 s | |
| 11 | **Crushed by Kindness** | Leave a crate at Pell's cart while you're near her. She gives you all of her bowls. | |
| 12 | **Pigeon Rapture** | Get crumbs from Pell, scatter them outdoors with E and don't move for 1.5 s. Moving scares them off. They can't reach you indoors. | |
| 13 | **Clothesline Express** | E at the washing line's end by the roof's west parapet. You zip down into the tram stop sign. | |
| 14 | **Self-Inflicted** | A body landing on you at 11 tiles/s or more, for example one you threw straight up with W | ✓ |
| 15 | **Two for One** | Be compacted while carrying an old body | ✓ |
| 16 | **Stairway to Heaven** | Reach up into the power line over the street. It's out of reach from every ledge. A tower of four upright bodies on the dumpster lid does it. Falling past it from above doesn't count, and neither do the pigeons. | ✓ |
| 17 | **Group Hug** | Three bodies land on you within half a second | ✓ |
| 18 | **Bored to Death** *(secret)* | Stand still with no input for 3 minutes | |
| 19 | **Died of Embarrassment** *(secret, bonus)* | Die outdoors where all four neighbours can see. That's just right of Pell's cart. It's awarded alongside the main death. | |
| 20 | **Tried Being a Plant** *(secret)* | E at Juniper's planter. You stay put until she waters you. | |
| 21 | **Died Laughing** *(twist)* | Read the paper Rook pins to the Death Board after the twist. Not an attempt. | |

## Interactions (E)

E uses the nearest thing within about 1.4 tiles: the vending machine, power strip, planter, washing line, compactor button, the Death Board corkboard, or a neighbour. A prompt at the top of the screen names it. With Pell's crumbs and nothing else in reach, E scatters them.

## The twist

1. After **12 unique deaths**, the replicator runs low on feedstock. The top bar warns, a red light blinks on the pod, and Bas says so.
2. The next death has no ding. The screen goes dark for 7 s while the neighbours' voices rebuild the android from their own things. Pell gives a pot-lid cheek, Rook a toy arm, Juniper a sprouting shoulder. These parts stay on every copy afterwards.
3. Rook pins the other half of the paper to the Death Board. Reading it shows **ONLY HUMANS DIE LAUGHING**, awards #21 Died Laughing, starts a rooftop party and puts the top bar's "Human" status at "provisionally". Play continues, and the neighbours' lines change.

Saving during the dark resumes as "feedstock low", so the twist is never skipped.

## Saving

Progress saves in the browser: the attempt count, the board, every body and prop, talk counts, crumbs and twist state. It saves on each death, respawn and twist step, every 5 s, and when the page is hidden or closed. **Start over…** in the pause menu erases it after a confirmation.

## Edge cases

- Invalid commands, such as grabbing with nothing in reach, interacting out of range or throwing while empty-handed, cannot change state.
- A corpse or prop can never end up inside a solid tile. If an overlap occurs, it is pushed out upward.
- If the player dies while holding something, the held object drops where it is.
- The simulation pauses during menus, while the tab is hidden and while the window is unfocused. Long frames are clamped on resume.

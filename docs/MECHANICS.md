# PROJECT BELOVED — MECHANICS

**Status:** Intended rules for v0.2. Numbers are starting tunables. Keep them in `src/game/balance.ts` and record any changes after implementation.

## Movement and interaction

- Side-view platformer with gravity. Walk, jump (with about 0.1 s of coyote time and a jump buffer), climb ladders, and drop through one-way platforms by pressing down.
- **Grab:** pick up the nearest prop or body in front of you (or under your feet), carry it above your head, then throw it or set it down. Grab again to throw forward. Hold up while grabbing to throw high, or hold down to set it down at your feet. Throws follow deterministic arcs.
- **Props and bodies are solid from above only.** You and other props can stand and stack on them, but you walk through them sideways and they fall through you. This keeps stacking stable and avoids pushing physics. Take something away from the bottom of a stack and everything above it falls.
- **Dropping below you:** in the air, hold down and grab to drop what you carry straight under your feet, then land on it. That is how towers of old bodies get built.
- **Placement is always valid.** A released prop goes to the first free spot: where it was carried (when throwing) or in front of your feet (when setting down). If that spot is blocked, it goes inside your own box, which is always free.
- **Interact (E):** talk to neighbours and use objects like the vending machine, crane controls, fryer or replicator.
- **Controls:** A/D or arrow keys to move, W/Up to climb, S/Down to climb down or drop through a platform, Space or K to jump, Shift or J to grab and throw, E to interact, Tab for the Death Board, Esc to pause. Gamepad support is optional.
- When two opposing directions are held, the most recently pressed one wins. Releasing it resumes the other.
- **Ladders:** press up beside a ladder or down at its top to climb. The top of a ladder works as a one-way platform. Jump to leap off, or press left or right to let go.

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

- Deaths are a hand-written registry (`src/game/data/deaths.ts`). Each entry has an id, a name, a joke line, Rook's hint, a star rating and a **trigger predicate** over the death event.
- A death is awarded once. Later repeats only add to its repeat count.
- Locked slots show a silhouette and Rook's hint.
- The first slice ships **20 deaths**: about 6 obvious, 10 clever and 4 secret.

| # | Death | Trigger sketch | Needs corpses? |
| --- | --- | --- | --- |
| 1 | **Gravity Research** | Fall from the roof (height above the threshold) | |
| 2 | **Mind the Gap** | Hit by the tram | |
| 3 | **Compacted** | Inside the compactor when it runs | |
| 4 | **Deep Fried** | Fall into Pell's fryer | |
| 5 | **Not Waterproof** | Enter the canal | |
| 6 | **Vending Machine Revenge** | Shake the machine until it tips onto you | |
| 7 | **Overclocked** | Plug yourself into the market power strip | |
| 8 | **Solar Flair** | Stand at the mirror array's focal point | |
| 9 | **Crane Game** | The magnet crane lifts you and drops you | |
| 10 | **Rusted Through** | Stand under Juniper's irrigation drip too long | |
| 11 | **Crushed by Kindness** | Help Pell, and her bowl tower topples onto you | |
| 12 | **Pigeon Rapture** | Scatter crumbs on the ledge while standing still | |
| 13 | **Clothesline Express** | Ride a laundry line into the tram stop sign | |
| 14 | **Self-Inflicted** | Hit by your own thrown corpse falling back down | ✓ |
| 15 | **Two for One** | Compacted while carrying a corpse | ✓ |
| 16 | **Stairway to Heaven** | Stack 5 corpses and jump from the top onto the antenna | ✓ |
| 17 | **Group Hug** | Three or more corpses land on you at once | ✓ |
| 18 | **Bored to Death** *(secret)* | Stand still for 3 minutes | |
| 19 | **Died of Embarrassment** *(secret)* | Die in sight of all four neighbours at once | |
| 20 | **Tried Being a Plant** *(secret)* | Plant yourself in a planter and wait for the water | |

Deaths 14–17 teach the player that their past selves are tools. **#21 Died Laughing** is awarded only by the twist.

## Neighbours

- Each neighbour has a home position and a small set of lines keyed by state: attempt count, specific deaths, the most recent death and twist progress.
- Interacting shows a speech bubble. Neighbours also speak unprompted after a death they witnessed, at most once per death.
- No pathfinding AI in this slice. Neighbours stay put or follow short scripted routes, such as Bas's cart.

## Edge cases

- Invalid commands, such as grabbing with nothing in reach, interacting out of range or throwing while empty-handed, cannot change state.
- A corpse or prop can never end up inside a solid tile. If an overlap occurs, it is pushed out upward.
- If the player dies while holding something, the held object drops where it is.
- The simulation pauses during menus, while the tab is hidden and while the window is unfocused. Long frames are clamped on resume.

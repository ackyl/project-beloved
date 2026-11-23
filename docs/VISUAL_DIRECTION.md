# PROJECT BELOVED — VISUAL AND FEEL

## Intent

A sunny, scrappy, lived-in neighbourhood where an earnest android keeps dying in ridiculous ways. Think dumpster-cozy and solarpunk-adjacent: patched, sun-bleached and full of plants. It is cyberpunk density without the neon, the rain or the gloom.

## Palette

| Role | Colours |
| --- | --- |
| Sky | Faded teal `#9cc3bd` fading to warm cream `#f1dcb3` |
| Buildings | Terracotta `#d39b72`, dusty clay `#b98a6b`, distant blue-grey `#86a7a1` |
| Life | Plant greens `#6f9a5a` and `#4f7444`, terracotta pots `#b8644a` |
| Tech | Solar-panel blue `#4d7a9c`, oxidised dumpster green `#5c7d69`, rust |
| Light | Warm window amber `#f4c77f` and sun cream `#fff1cf` |
| Accents | Laundry pastels: blush, butter, sky, linen, sage |

No neon, no saturated magenta or cyan, and no dark rainy scenes.

## Scene composition

- **Side-view pixel art:** a low-resolution internal canvas scaled up with nearest-neighbour filtering. There are three depth layers: a far skyline, mid-ground buildings, and the playable layer.
- **Density:** the block should feel stacked and patched together, with water tanks, antennas, tarps, laundry lines, potted tomatoes on dumpsters and hand-painted signs.
- **Android:** a small, round-edged and readable sprite. Its stiff corpse poses (upright, flat, upside-down) must read as funny, not gruesome. Use sparks and loose bolts, never gore.
- **Neighbours:** distinct silhouettes and colour accents so each can be recognised at a glance.

## Feel

- **Movement:** snappy acceleration, short coyote time, a satisfying jump arc and a little squash on landing.
- **Death:** a hit-stop of a few frames, a freeze into a stiff pose, a burst of sparks and bolts, and a comic sound. The death card slides in quickly. Pacing matters more than spectacle: the full cycle takes at most 3 s.
- **Respawn:** the replicator glows and dings, and the new copy steps out with a small hop.
- **Throws and stacking:** corpses land with a woody clack and settle without jitter.

## UI direction

- The shell is warm charcoal with cream "paper" text, terracotta and faded-teal accents, and a Space Mono font for counters.
- The **Death Board** is a corkboard of polaroid cards with handwritten-style captions, plus Rook's star ratings in pencil.
- Death cards slide up from the bottom and must not cover the playable area for long.
- Keep the HUD to the top bar: the attempt count, the "Human: not yet" status and the audio and pause buttons.

## Audio

Lightweight Web Audio cues: footsteps, jump, grab and throw, a comic stinger for each death category, the replicator ding, and ambient street sounds such as pigeons and a distant tram. Audio starts muted.

## Placeholder policy

Chunk 0 ships a code-drawn placeholder street. Code-drawn pixel sprites are fine through Chunk 3. Label placeholder art in the UI and docs until it's replaced.

# PROJECT BELOVED — VISUAL AND FEEL

## Intent

A lived-in sci-fi city block at dusk. The walk-up doubles as an android service station, with a replicator, diagnostics, bulky alloy walls and observation windows overlooking the city. The street vendors and rooftop plants keep the setting inhabited.

## Palette

| Role | Colours |
| --- | --- |
| Sky | Indigo `#27344f` through mauve `#636884` and dusty rose `#c29491` |
| City | Distant steel blue `#596381`, slate `#394762`, near navy `#27344c` |
| Walk-up | Alloy `#55697b`, graphite `#343e53`, pale edge `#8da5ad` |
| Equipment | Cyan `#82ccd1` and amber `#cf975b` indicators |
| Android | Ceramic `#e5f1ea`, brushed alloy `#8ba7b4`, amber markings and mint optics |

## Scene composition

- **Side-view pixel art.** Scale the canvas in whole device pixels. Use three parallax building layers with recessed facades and fixed lights. Keep distant surfaces subdued.
- **Playable surfaces.** Use light seams for ledges and rungs. Interior wall panels and windows sit behind the action with lower contrast than the player.
- **Android.** Use a recognisable helmet and dark faceplate, hard shoulder plates, visible knee and elbow joints, and separated boots. Power down the visor on corpses. Show sparks and loose bolts on impact.
- **Neighbours.** Give each neighbour distinct clothing, colours and a recognisable accessory.

## Feel

- **Movement:** snappy acceleration, short coyote time, a satisfying jump arc and a little squash on landing.
- **Death:** a hit-stop of a few frames, a freeze into a stiff pose, a burst of sparks and bolts, and a comic sound. The death card slides in quickly. Pacing matters more than spectacle: the full cycle takes at most 3 s.
- **Respawn:** the replicator glows and dings, and the new copy steps out with a small hop.
- **Throws and stacking:** corpses land with a woody clack and settle without jitter.

## UI direction

- The shell uses slate and pale text with amber accents and Space Mono counters. Keep the paper cards warm.
- The **Death Board** is a corkboard of polaroid cards with handwritten-style captions, plus Rook's star ratings in pencil.
- Death cards slide up from the bottom and must not cover the playable area for long.
- Keep the HUD to the top bar: the attempt count, the "Human: not yet" status and the audio and pause buttons.

## Audio

Lightweight Web Audio cues: footsteps, jump, grab and throw, a comic stinger for each death category, the replicator ding, and ambient street sounds such as pigeons and a distant tram. Audio starts muted.

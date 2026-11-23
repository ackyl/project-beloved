import { TWIST_AT, TWIST_DARK_TICKS } from "./balance";
import { deathById } from "./data/deaths";
import { respawn, uniqueDeaths } from "./death";
import type { NeighbourId } from "./level/level";
import { emit, type Game } from "./state";

// The twist, in three steps:
//   1. After TWIST_AT unique deaths, the replicator runs low on feedstock.
//   2. The next death has no ding. In the dark, the neighbours rebuild you
//      from their own things.
//   3. Reading the paper Rook pins to the Death Board: ONLY HUMANS DIE LAUGHING.

/** Lines heard in the dark, and when (ticks into the dark). */
export const DARK_LINES: { at: number; who: NeighbourId; text: string }[] = [
  { at: 40, who: "bas", text: "That's it. Out of feedstock. Out of him." },
  { at: 120, who: "pell", text: "Then we use something else. Here. My good pot lid." },
  { at: 200, who: "rook", text: "take my robot's arm. it's fine. i'm too old for it anyway." },
  { at: 280, who: "juniper", text: "The shoulder wants a bit of life in it. Hold still." },
  { at: 360, who: "bas", text: "...Fine. Fire it up. Come on, kid." },
];

export const PAPER = { left: "ONLY HUMANS DIE", right: "LAUGHING." };

/** Called after every death. */
export function afterDeath(g: Game) {
  if (g.twist === 0 && uniqueDeaths(g) >= TWIST_AT) {
    g.twist = 1;
    g.twistAttempt = g.attempts;
    emit(g, { type: "twist", step: 1 });
    emit(g, { type: "speech", who: "bas", text: "Feedstock's low, kid. I'm out of you. ...Don't do anything daft. Daft-er." });
  } else if (g.twist === 1 && g.attempts > g.twistAttempt) {
    // This death is the one without a ding.
    g.twist = 1.5;
    g.phase = "twist";
    g.phaseTicks = 0;
    emit(g, { type: "twist", step: 2 });
  }
}

export function updateDark(g: Game) {
  if (g.phase !== "twist") return;
  for (const line of DARK_LINES)
    if (g.phaseTicks === line.at) emit(g, { type: "speech", who: line.who, text: line.text });
  if (g.phaseTicks >= TWIST_DARK_TICKS) {
    g.twist = 2;
    g.rebuilt = true;
    respawn(g);
    emit(g, { type: "speech", who: "rook", text: "you're back! i pinned something on your board. go read it." });
  }
}

/** Reading Rook's half of the paper. Not a death. Awarded once. */
export function readPaper(g: Game) {
  if (g.twist !== 2 || g.board.laughing) return false;
  g.board.laughing = { count: 1, first: g.attempts };
  g.party = 1;
  const def = deathById.laughing;
  emit(g, { type: "twist", step: 3 });
  emit(g, {
    type: "death",
    attempt: g.attempts,
    cause: "laughing",
    id: def.id,
    isNew: true,
    count: 1,
    bonus: [],
    corpse: null,
    x: 0,
    y: 0,
  });
  return true;
}

export function updateParty(g: Game) {
  if (!g.party) return;
  g.party++;
  const lines: [number, NeighbourId, string][] = [
    [90, "pell", "Party on the roof! Bring nothing. I've made noodles."],
    [240, "juniper", "You laughed. That's the most human thing I've seen all week."],
    [390, "bas", "Don't get sentimental. ...Happy birthday, or whatever."],
    [540, "rook", "five stars. obviously."],
  ];
  for (const [at, who, text] of lines) if (g.party === at) emit(g, { type: "speech", who, text });
}

import type { NeighbourId } from "../level/level";
import { BOARD, deathById, type DeathId } from "./deaths";

// The four residents. Lines are short and chosen from game state: how many
// attempts, which deaths, and how far the twist has gone. No dialogue trees.
export const NEIGHBOURS: Record<NeighbourId, { name: string; short: string }> = {
  pell: { name: "Auntie Pell", short: "Pell" },
  rook: { name: "Rook", short: "Rook" },
  bas: { name: "Bas", short: "Bas" },
  juniper: { name: "Juniper", short: "Juniper" },
};

/** What the talk lines can see of the game. */
export type TalkState = {
  attempts: number;
  board: Partial<Record<DeathId, { count: number }>>;
  carted: number;
  /** 0 before the twist, 1 while feedstock is low, 2 after it. */
  twist: number;
  /** How many times you have talked to this neighbour. */
  talks: number;
  hasCrumbs: boolean;
};

const pick = (lines: string[], n: number) => lines[n % lines.length];
const has = (s: TalkState, id: DeathId) => !!s.board[id];
const found = (s: TalkState) => BOARD.filter((d) => s.board[d.id]).length;

export function talk(id: NeighbourId, s: TalkState): string {
  switch (id) {
    case "pell":
      if (s.twist === 2)
        return pick(
          [
            "That cheek was my good pot lid, you know. Suits you better.",
            "Eat something. I know you can't. Humour me.",
            "Every one of you has had a bowl from me. Every single one.",
          ],
          s.talks,
        );
      if (s.twist === 1) return "Bas came by asking for pots. Pots! What would he want with pots?";
      if (!s.hasCrumbs && s.talks === 0)
        return "You look thin, love. Here, crumbs. For the pigeons, not you. Don't let them get ideas.";
      if (has(s, "fried") && s.talks % 3 === 1)
        return "You were in my fryer again. I had to throw out the whole batch. ...Are you hungry?";
      if (s.attempts >= 10 && s.talks % 3 === 2)
        return `${s.attempts} of you now. I've started setting extra places.`;
      return pick(
        [
          "Noodles? No? Suit yourself. More for the pigeons.",
          "My cart could use a hand. Bring me a crate sometime, would you?",
          "Humans? Dear, we just eat noodles and worry. You'd love it.",
          "Here, more crumbs. The pigeons have been asking after you.",
        ],
        s.talks,
      );
    case "rook": {
      if (s.twist === 2)
        return pick(
          [
            "i put the other half of the paper on your board. you're welcome.",
            "you laughed. i've got it written down. that's a five.",
            "my teacher says the poster was 'too much'. it was not too much.",
          ],
          s.talks,
        );
      const next = BOARD.find((d) => !s.board[d.id] && !d.bonus);
      if (s.attempts === 0) return "you're the robot that wants to be a person? cool. i'll rate it. go on.";
      if (!next) return "you've done all of them. i've run out of stars. i'm drawing more.";
      return pick(
        [
          `that's ${found(s)} out of ${BOARD.length}. next one: ${next.hint}`,
          `i give your last one... hm. needs more flair. try: ${next.hint}`,
          `my notebook's nearly full of you. ${next.hint}`,
        ],
        s.talks,
      );
    }
    case "bas":
      if (s.twist === 2)
        return pick(
          [
            "Fed every one of you back into that pod. Waste not.",
            "Don't look at me like that. Somebody had to do the recycling.",
            "Your left arm's Rook's toy. Don't tell him it squeaks.",
          ],
          s.talks,
        );
      if (s.twist === 1) return "Feedstock's low. I'm out of you, kid. ...Don't do anything daft. Daft-er.";
      if (s.carted > 0 && s.talks % 2 === 0)
        return `Carted ${s.carted} of you off already. Keeping the good bits. For reasons.`;
      return pick(
        [
          "Don't touch the compactor. ...Unless you want to. It's a free country.",
          "The magnet picks up anything metal. Anything. Just saying.",
          "Mirrors are for the solar still. Not for standing in. Probably.",
          "You again. Which one are you, then? Doesn't matter. Same face.",
        ],
        s.talks,
      );
    case "juniper":
      if (s.twist === 2)
        return pick(
          [
            "Your shoulder's sprouting. Water it on Tuesdays.",
            "Everything comes back if you let people help. Even you.",
          ],
          s.talks,
        );
      if (has(s, "rusted") && s.talks % 2 === 1) return "You made lovely compost, by the way. Very rich in iron.";
      return pick(
        [
          "Sun's good today. You could photosynthesise, if you really tried.",
          "Mind the drip. It's for the tomatoes, not for you. Unless you're a tomato.",
          "The planter's got room for one more, if you're looking to put down roots.",
          "That washing line goes all the way to the tram stop. Fast way down.",
        ],
        s.talks,
      );
  }
}

/** A neighbour who saw a death says something about it. */
export function reaction(id: NeighbourId, death: DeathId | null, attempt: number): string {
  const name = death ? deathById[death].name : null;
  const lines: Record<NeighbourId, string[]> = {
    pell: ["Oh, sweetheart.", "Not again, love.", "I'll put the kettle on.", "That one looked like it hurt. Did it hurt?"],
    rook: [
      name ? `${name.toLowerCase()}. writing that down.` : "boring. doesn't count.",
      "needs more flair.",
      "ooh. that's going on the board.",
    ],
    bas: ["That's coming out of your deposit.", "I'll get the cart.", "Mind the paintwork."],
    juniper: ["Back to the earth. Well, the pavement.", "Circle of life.", "You'll grow back."],
  };
  return lines[id][attempt % lines[id].length];
}

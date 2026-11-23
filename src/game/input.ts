import type { Direction, Game } from "./state";

/** The most recently pressed of two opposing directions wins. */
export function axis(g: Game, neg: Direction, pos: Direction) {
  for (let i = g.input.held.length - 1; i >= 0; i--) {
    const d = g.input.held[i].dir;
    if (d === neg) return -1;
    if (d === pos) return 1;
  }
  return 0;
}

import type { Game } from "./state";

/** E: use the nearest interactable. Chunk 3 fills this in. */
export function interact(_g: Game) {}

/** Label for the interaction prompt, or null when nothing is in reach. */
export function prompt(_g: Game): string | null {
  return null;
}

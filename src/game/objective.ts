import type { Game } from "./simulation";
import { HOME } from "./world";
export function objective(g: Game) {
  if (!g.bag.bloom)
    return {
      name: "Find a lumen bloom",
      detail: "Dig beneath the eastern shelf.",
      point: g.world.bloom,
    };
  if (!g.panelOpen)
    return {
      name: "Trace the answering signal",
      detail: "Open the old medical annex.",
      point: { x: g.world.annex.x - 0.5, y: g.world.annex.y + 0.5 },
    };
  if (!g.learned)
    return {
      name: "Study the lumen bloom",
      detail: "Return to the sanctuary console.",
      point: HOME,
    };
  if (!g.revealed)
    return {
      name: "Ease their breathing",
      detail: g.prepared
        ? "Bring the dose to the curtain."
        : "Prepare a breathing treatment.",
      point: HOME,
    };
  return {
    name: "The hollow remembers",
    detail: "Care cycle complete. Explore freely.",
    point: null,
  };
}

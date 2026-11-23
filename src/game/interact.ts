import { INTERACT_RANGE, VENDING_SHAKES } from "./balance";
import { NEIGHBOURS, talk } from "./data/neighbours";
import { kill } from "./death";
import { isSolid, type Interactable, type NeighbourId } from "./level/level";
import { runCompactor } from "./machines";
import { bottom, centerX } from "./physics";
import { emit, type Game } from "./state";
import { heldBody } from "./props";
import { readPaper } from "./twist";

type Target = Interactable | { kind: "crumbs"; x: number; y: number };

/** Everything E can use, including the neighbours. */
function candidates(g: Game): Interactable[] {
  return [
    ...g.level.interactables,
    ...g.level.neighbours.map((n) => ({ kind: "neighbour" as const, x: n.x, y: n.y, id: n.id })),
  ];
}

/** The open sky directly above the player, all the way up. */
export function outdoors(g: Game) {
  const p = g.player,
    col = Math.floor(centerX(p));
  for (let y = Math.floor(p.y); y >= 0; y--) if (isSolid(g.level, col, y)) return false;
  return true;
}

export function target(g: Game): Target | null {
  const p = g.player;
  if (g.phase !== "alive" || p.zip || p.planted || p.pigeons || p.lifted) return null;
  let best: Interactable | null = null,
    bestD = Infinity;
  for (const c of candidates(g)) {
    const dx = Math.abs(c.x - centerX(p)),
      dy = Math.abs(c.y - bottom(p));
    if (dx > INTERACT_RANGE.x || dy > INTERACT_RANGE.y) continue;
    const d = dx + dy;
    if (d < bestD) {
      best = c;
      bestD = d;
    }
  }
  if (best) return best;
  if (p.crumbs && p.grounded) return { kind: "crumbs", x: centerX(p), y: bottom(p) };
  return null;
}

/** Label for the interaction prompt, or null when nothing is in reach. */
export function prompt(g: Game): string | null {
  const t = target(g);
  if (!t) return null;
  switch (t.kind) {
    case "vending":
      return g.vending?.phase === "up" ? "Shake the vending machine" : null;
    case "powerStrip":
      return "Plug yourself in";
    case "planter":
      return "Plant yourself";
    case "zipline":
      return "Ride the washing line";
    case "compactorButton":
      return g.compactor?.phase === "idle" ? "Run the compactor" : null;
    case "deathBoard":
      return g.twist === 2 && !g.board.laughing ? "Read the paper Rook pinned up" : "Read the Death Board";
    case "neighbour":
      return `Talk to ${NEIGHBOURS[t.id as NeighbourId].name}`;
    case "crumbs":
      return "Scatter crumbs";
  }
}

export function say(g: Game, who: NeighbourId | "you", text: string) {
  emit(g, { type: "speech", who, text });
}

/** E: use the nearest interactable. */
export function interact(g: Game) {
  const t = target(g),
    p = g.player;
  if (!t) return;
  switch (t.kind) {
    case "vending": {
      const v = g.vending;
      if (!v || v.phase !== "up") return;
      v.shakes++;
      v.dir = centerX(p) >= t.x ? 1 : -1;
      emit(g, { type: "interact", label: "shake" });
      if (v.shakes >= VENDING_SHAKES) {
        v.phase = "tipping";
        v.timer = 0;
      }
      return;
    }
    case "powerStrip":
      kill(g, "power");
      return;
    case "planter": {
      const held = heldBody(g);
      if (held) return;
      p.planted = 1;
      p.x = t.x - p.w / 2;
      p.y = t.y - p.h + 0.35;
      p.vx = 0;
      p.vy = 0;
      say(g, "juniper", "Oh! A new seedling. I'll fetch the watering can.");
      return;
    }
    case "zipline":
      p.zip = 1;
      p.vx = 0;
      p.vy = 0;
      p.climbing = false;
      say(g, "you", "Wheee—");
      return;
    case "compactorButton":
      if (runCompactor(g)) say(g, "bas", "Oi! Who pressed that?");
      return;
    case "deathBoard":
      if (!readPaper(g)) emit(g, { type: "openBoard" });
      return;
    case "neighbour": {
      const id = t.id as NeighbourId;
      const text = talk(id, {
        attempts: g.attempts,
        board: g.board,
        carted: g.carted,
        twist: g.twist,
        talks: g.talks[id],
        hasCrumbs: p.crumbs,
      });
      g.talks[id]++;
      if (id === "pell" && g.twist !== 1) p.crumbs = true;
      say(g, id, text);
      return;
    }
    case "crumbs":
      if (!outdoors(g)) {
        say(g, "you", "The pigeons can't get in here. Better go outside.");
        return;
      }
      p.crumbs = false;
      p.pigeons = 1;
      say(g, "you", "Here, pigeons. Here, community.");
      return;
  }
}

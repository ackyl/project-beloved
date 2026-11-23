import { CORPSE_CAP, PRINT_TICKS } from "./balance";
import {
  bonusFor,
  classify,
  deathById,
  UNCATALOGUED,
  type Cause,
  type CorpsePose,
  type DeathEvent,
} from "./data/deaths";
import { INTERIOR, tileAt } from "./level/level";
import { reaction } from "./data/neighbours";
import { bottom, centerX, isFree } from "./physics";
import { findSpot, heldBody, place, carryPosition } from "./props";
import { corpseSize, emit, newPlayer, type Body, type Game } from "./state";

/** Neighbours can see deaths outdoors within this many tiles. */
export const SIGHT = { x: 22, y: 14 };

export function watchers(g: Game) {
  const p = g.player,
    cx = centerX(p),
    by = bottom(p);
  if (INTERIOR.has(tileAt(g.level, Math.floor(cx), Math.floor(by - 0.5)))) return 0;
  return g.level.neighbours.filter(
    (n) => Math.abs(n.x - cx) <= SIGHT.x && Math.abs(n.y - by) <= SIGHT.y,
  ).length;
}

export type KillOptions = Partial<Omit<DeathEvent, "cause">> & {
  /** Velocity given to the corpse. */
  fling?: { vx: number; vy: number };
  /** Where the corpse appears (feet centre), if not where the player is. */
  at?: { x: number; y: number };
  /** Force a pose regardless of the death, for example a cube from the compactor. */
  pose?: CorpsePose;
};

function newCorpse(g: Game, pose: CorpsePose, tint: Body["tint"], cx: number, by: number): Body {
  const size = corpseSize(pose);
  const corpse: Body = {
    id: g.nextId++,
    kind: "corpse",
    x: cx - size.w / 2,
    y: by - size.h,
    ...size,
    vx: 0,
    vy: 0,
    grounded: false,
    held: false,
    bonked: true,
    pose,
    tint,
    attempt: g.attempts,
  };
  if (!isFree(g.level, corpse)) {
    const spot = findSpot(g, size.w, size.h, cx, by);
    if (spot) Object.assign(corpse, spot);
    else {
      // The player's own box is always free, and an upright corpse fits it exactly.
      const p = g.player;
      Object.assign(corpse, corpseSize("upright"), { pose: "upright", x: p.x, y: p.y });
    }
  }
  // Dying on top of an old body stacks the new one on it instead of overlapping.
  for (let i = 0; i < 8; i++) {
    const under = g.bodies.filter(
      (b) => !b.held && !b.lifted && b.x < corpse.x + corpse.w && b.x + b.w > corpse.x && b.y < corpse.y + corpse.h && b.y + b.h > corpse.y,
    );
    if (!under.length) break;
    const y = Math.min(...under.map((b) => b.y)) - corpse.h;
    if (!isFree(g.level, { ...corpse, y })) break;
    corpse.y = y;
  }
  return corpse;
}

/** Ends the current copy. The body stays exactly where it fell. */
export function kill(g: Game, cause: Cause, o: KillOptions = {}) {
  if (g.phase !== "alive") return;
  const p = g.player;
  const held = heldBody(g);
  const event: DeathEvent = {
    cause,
    fall: o.fall ?? 0,
    lifted: o.lifted ?? p.lifted,
    holdingCorpse: o.holdingCorpse ?? held?.kind === "corpse",
    bonkKind: o.bonkKind ?? null,
    bonks: o.bonks ?? 0,
    watchers: o.watchers ?? watchers(g),
  };
  // Drop whatever was carried, where it was carried.
  if (held) {
    held.held = false;
    p.holding = null;
    place(g, held, [carryPosition(p, held)]);
  }
  g.attempts++;
  const def = classify(event);
  const bonus = bonusFor(event).filter((d) => !g.board[d.id]);
  let isNew = false,
    count = 0;
  for (const d of def ? [def, ...bonus] : bonus) {
    const entry = (g.board[d.id] ??= { count: 0, first: g.attempts });
    entry.count++;
    if (d === def) {
      isNew = entry.count === 1;
      count = entry.count;
    }
  }
  const pose = o.pose ?? def?.pose ?? UNCATALOGUED.pose,
    tint = def?.tint ?? UNCATALOGUED.tint;
  const at = o.at ?? { x: centerX(p), y: bottom(p) };
  const corpse = newCorpse(g, pose, tint, at.x, at.y);
  if (o.fling) {
    corpse.vx = o.fling.vx;
    corpse.vy = o.fling.vy;
  }
  g.bodies.push(corpse);
  cartOldest(g);
  g.phase = "dead";
  g.phaseTicks = 0;
  g.skip = false;
  g.last = {
    attempt: g.attempts,
    cause,
    id: def?.id ?? null,
    isNew,
    count,
    bonus: bonus.map((d) => d.id),
    corpse: corpse.id,
    x: centerX(corpse),
    y: bottom(corpse),
  };
  emit(g, { type: "death", ...g.last });
  // Someone who saw it says something.
  const seen = g.level.neighbours.filter((n) => sees(g, n, corpse));
  if (seen.length) {
    const who = seen[g.attempts % seen.length];
    emit(g, { type: "speech", who: who.id, text: reaction(who.id, g.last.id, g.attempts) });
  }
}

function sees(g: Game, n: { x: number; y: number }, b: { x: number; y: number; w: number; h: number }) {
  return Math.abs(n.x - (b.x + b.w / 2)) <= SIGHT.x && Math.abs(n.y - (b.y + b.h)) <= SIGHT.y && !INTERIOR.has(tileAt(g.level, Math.floor(b.x + b.w / 2), Math.floor(b.y + b.h - 0.5)));
}

/** Bas wheels the oldest body away once there are too many. */
function cartOldest(g: Game) {
  const corpses = g.bodies.filter((b) => b.kind === "corpse");
  while (corpses.length > CORPSE_CAP) {
    const oldest = corpses.shift()!;
    if (oldest.held || oldest.lifted) continue;
    g.bodies.splice(g.bodies.indexOf(oldest), 1);
    g.carted++;
    emit(g, { type: "carted", attempt: oldest.attempt ?? 0 });
    emit(g, { type: "speech", who: "bas", text: `Taking attempt ${oldest.attempt ?? 0}. For scrap. Don't ask.` });
  }
}

/** The replicator prints a fresh copy at the pod. */
export function respawn(g: Game) {
  g.player = newPlayer(g.level);
  g.phase = "printing";
  g.phaseTicks = 0;
  g.skip = false;
  g.input.jumpBuffer = 0;
  g.input.upBuffer = 0;
  g.input.grabQueued = false;
  g.input.interactQueued = false;
  emit(g, { type: "respawn" });
}

export function finishPrinting(g: Game) {
  if (g.phase === "printing" && g.phaseTicks >= PRINT_TICKS) {
    g.phase = "alive";
    g.phaseTicks = 0;
  }
}

/** Unique board entries found so far, excluding the twist. */
export const uniqueDeaths = (g: Game) =>
  Object.keys(g.board).filter((id) => !deathById[id as keyof typeof deathById].twist).length;

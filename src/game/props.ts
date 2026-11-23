import {
  BONK_SPEED,
  GRAB_REACH,
  GRAVITY,
  PROP_FRICTION,
  STEP,
  THROW_FORWARD,
  THROW_UP,
} from "./balance";
import { bottom, centerX, clampVelocity, isFree, moveX, moveY, overlaps, type Box } from "./physics";
import { emit, type Body, type Game, type Player } from "./state";
import { axis } from "./input";

export const heldBody = (g: Game) =>
  g.player.holding === null ? null : (g.bodies.find((b) => b.id === g.player.holding) ?? null);

/** Surfaces you can stand on that are not tiles: loose bodies, ledges and the tram roof. */
export function tops(g: Game): Box[] {
  const list: Box[] = g.bodies.filter((b) => !b.held && !b.lifted);
  list.push(...g.level.ledges);
  const tram = tramBox(g);
  if (tram) list.push(tram);
  return list;
}

export function tramBox(g: Game): Box | null {
  const m = g.level.machines.tram;
  if (!m || !g.tram || g.tram.x <= m.hiddenX + 0.01) return null;
  return { x: g.tram.x, y: m.rail - m.height, w: m.length, h: m.height };
}

const approach = (v: number, target: number, rate: number) =>
  v < target ? Math.min(target, v + rate) : Math.max(target, v - rate);

/** Where a held prop rides: centred on top of the player's head. */
export function carryPosition(p: Player, b: Body) {
  return { x: centerX(p) - b.w / 2, y: p.y - b.h + 0.05 };
}

/** Nearest free spot to (cx, bottomY) for a box of this size, searching up to 3 tiles. */
export function findSpot(g: Game, w: number, h: number, cx: number, bottomY: number) {
  const steps = [0];
  for (let i = 1; i <= 6; i++) steps.push(i * 0.25, -i * 0.25);
  for (let up = 0; up <= 12; up++)
    for (const dx of steps) {
      const spot = { x: cx - w / 2 + dx, y: bottomY - h - up * 0.25 };
      if (isFree(g.level, { ...spot, w, h })) return spot;
    }
  return null;
}

/**
 * Puts a released body at the first free spot among the candidates, then
 * inside the player's own box (always free), then nearby.
 */
export function place(g: Game, b: Body, candidates: { x: number; y: number }[]) {
  const p = g.player;
  const all = [...candidates];
  if (b.w <= p.w + 1e-9 && b.h <= p.h + 1e-9)
    all.push({ x: centerX(p) - b.w / 2, y: bottom(p) - b.h });
  for (const c of all)
    if (isFree(g.level, { ...b, ...c })) {
      b.x = c.x;
      b.y = c.y;
      return;
    }
  const spot = findSpot(g, b.w, b.h, centerX(p), bottom(p));
  if (spot) {
    b.x = spot.x;
    b.y = spot.y;
  }
}

export function release(g: Game) {
  const held = heldBody(g);
  if (!held) return null;
  held.held = false;
  g.player.holding = null;
  place(g, held, [carryPosition(g.player, held)]);
  held.vx = 0;
  held.vy = 0;
  return held;
}

export function grabOrThrow(g: Game) {
  const p = g.player,
    held = heldBody(g),
    vertical = axis(g, "up", "down");
  if (held) {
    held.held = false;
    held.grounded = false;
    p.holding = null;
    held.vx = 0;
    held.vy = 0;
    if (vertical > 0) {
      const front = { x: p.facing > 0 ? p.x + p.w + 0.05 : p.x - held.w - 0.05, y: bottom(p) - held.h };
      // In the air, down drops it straight below your feet: how towers get built.
      const below = { x: centerX(p) - held.w / 2, y: bottom(p) + 0.02 };
      place(g, held, !p.grounded && !p.climbing ? [below, front] : [front]);
      emit(g, { type: "throw" });
      return;
    }
    place(g, held, [carryPosition(p, held)]);
    const t = vertical < 0 ? THROW_UP : THROW_FORWARD;
    held.vx = p.facing * t.vx + p.vx * t.carry;
    held.vy = t.vy;
    emit(g, { type: "throw" });
    return;
  }
  if (p.climbing) return;
  const reach: Box = {
    x: p.facing > 0 ? p.x : p.x - GRAB_REACH,
    y: p.y - 0.1,
    w: p.w + GRAB_REACH,
    h: p.h + 0.3,
  };
  let best: Body | null = null,
    bestDistance = Infinity;
  for (const b of g.bodies) {
    if (b.held || b.lifted || !overlaps(reach, b)) continue;
    const d = Math.hypot(centerX(b) - centerX(p), bottom(b) - bottom(p));
    if (d < bestDistance) {
      best = b;
      bestDistance = d;
    }
  }
  if (!best) return;
  best.held = true;
  best.vx = 0;
  best.vy = 0;
  p.holding = best.id;
  emit(g, { type: "grab" });
}

export function updateBodies(g: Game) {
  const p = g.player,
    alive = g.phase === "alive";
  // Lowest first, so a stack settles from the bottom up in one tick.
  const loose = g.bodies
    .filter((b) => !b.held && !b.lifted)
    .sort((a, b) => bottom(b) - bottom(a) || a.id - b.id);
  const surfaces = tops(g);
  for (const b of loose) {
    b.vy += GRAVITY * STEP;
    if (b.grounded) b.vx = approach(b.vx, 0, PROP_FRICTION * STEP);
    clampVelocity(b);
    if (moveX(g.level, b, b.vx * STEP)) b.vx *= -0.2;
    const prevBottom = bottom(b),
      speed = b.vy;
    const hit = moveY(g.level, b, b.vy * STEP, { tops: surfaces });
    b.grounded = hit === "floor";
    if (hit) {
      b.vy = 0;
      b.bonked = false;
    }
    // A body dropping onto the android's head.
    if (
      alive &&
      speed > 2 &&
      !b.bonked &&
      overlaps(b, p) &&
      prevBottom <= p.y + 0.35
    ) {
      b.bonked = true;
      p.bonks.push({ tick: g.ticks, kind: b.kind === "corpse" ? "corpse" : "prop", speed });
      emit(g, { type: "bonk" });
    }
  }
  const held = heldBody(g);
  if (held) Object.assign(held, carryPosition(p, held));
}

export { BONK_SPEED };

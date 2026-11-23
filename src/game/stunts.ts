import {
  BORED_TICKS,
  DRIP_TICKS,
  KINDNESS_TICKS,
  PIGEON_GATHER_TICKS,
  PIGEON_LIFT_SPEED,
  PLANT_TICKS,
  SOLAR_TICKS,
  STEP,
  ZIP_TICKS,
} from "./balance";
import { kill } from "./death";
import { say } from "./interact";
import { inZone } from "./machines";
import { bottom, centerX, overlaps } from "./physics";
import { findSpot } from "./props";
import type { Game } from "./state";

/**
 * Handles the player while something else is in charge: riding the washing
 * line, planted, carried off by pigeons, or hanging from the crane magnet.
 * Returns true when normal movement should not run this tick.
 */
export function controlled(g: Game) {
  const p = g.player;
  if (g.crane?.player) return true;
  if (p.zip) {
    const z = g.level.machines.zipline!;
    const t = Math.min(1, p.zip / ZIP_TICKS),
      eased = t * t;
    const lx = z.x1 + (z.x2 - z.x1) * eased,
      ly = z.y1 + (z.y2 - z.y1) * eased;
    p.x = lx - p.w / 2;
    p.y = ly + 0.1;
    p.facing = z.x2 < z.x1 ? -1 : 1;
    p.peak = bottom(p);
    p.zip++;
    if (t >= 1) kill(g, "zipline");
    return true;
  }
  if (p.planted) {
    p.planted++;
    if (p.planted >= PLANT_TICKS) kill(g, "planted");
    return true;
  }
  if (p.pigeons > PIGEON_GATHER_TICKS) {
    p.pigeons++;
    p.y -= PIGEON_LIFT_SPEED * STEP;
    p.vx = 0;
    p.vy = 0;
    p.peak = bottom(p);
    if (bottom(p) < -0.5) kill(g, "pigeons", { at: { x: centerX(p), y: 0.6 } });
    return true;
  }
  return false;
}

/** Timers and zones checked after movement. */
export function updateStunts(g: Game) {
  if (g.phase !== "alive") return;
  const p = g.player;
  // Pigeons gather while you stand still. Moving scares them off.
  if (p.pigeons > 0 && p.pigeons <= PIGEON_GATHER_TICKS) {
    if (Math.abs(p.vx) > 0.2 || !p.grounded || p.climbing) {
      p.pigeons = 0;
      say(g, "you", "They left. I moved. Rude of me.");
    } else if (++p.pigeons > PIGEON_GATHER_TICKS) say(g, "you", "Oh! Oh no. Oh, lovely. Oh no.");
  }
  p.heat = inZone(g, "solar") ? p.heat + 1 : Math.max(0, p.heat - 2);
  if (p.heat >= SOLAR_TICKS) return kill(g, "solar");
  p.damp = inZone(g, "drip") ? p.damp + 1 : Math.max(0, p.damp - 2);
  if (p.damp >= DRIP_TICKS) return kill(g, "drip");
  // Only reaching up into the line counts, not falling past it from above.
  // Pigeons know to fly around it.
  if (p.vy < 1 && !p.pigeons && inZone(g, "powerline")) return kill(g, "powerline");
  if (p.idleTicks >= BORED_TICKS) return kill(g, "bored");
}

/** Bring Pell a crate and she insists on giving you her bowls. All of them. */
export function updateKindness(g: Game) {
  const pell = g.level.neighbours.find((n) => n.id === "pell");
  const cart = g.level.zones.find((z) => z.kind === "pellCart");
  if (!pell || !cart) return;
  if (g.kindness > 0) {
    if (--g.kindness > 0) return;
    const p = g.player;
    if (g.phase === "alive" && Math.abs(centerX(p) - pell.x) <= 3.2 && Math.abs(bottom(p) - pell.y) < 1.6)
      kill(g, "kindness");
    else say(g, "pell", "...Oh. Where'd you go? I'll keep them warm.");
    return;
  }
  for (const b of g.bodies) {
    if (b.kind !== "crate" || b.held || !b.grounded || !overlaps(cart, b)) continue;
    const spot = findSpot(g, b.w, b.h, pell.x + 1.1, pell.y);
    if (spot) Object.assign(b, spot);
    g.kindness = KINDNESS_TICKS;
    say(g, "pell", "A crate! Thank you, love. Here, take these bowls. And these. And—");
    return;
  }
}

import {
  BONK_SPEED,
  BONK_WINDOW,
  COMPACTOR_HOLD_TICKS,
  COMPACTOR_IDLE_TICKS,
  COMPACTOR_RISE_SPEED,
  COMPACTOR_SLAM_SPEED,
  COMPACTOR_WARN_TICKS,
  CRANE_FALL,
  FALL_DEATH,
  GROUP_HUG_BONKS,
  PROP_SIZES,
  STEP,
  TRAM_AWAY_TICKS,
  TRAM_BELL_TICKS,
  TRAM_DWELL_TICKS,
  TRAM_FIRST_TICKS,
  TRAM_FLING,
  TRAM_SPEED,
} from "./balance";
import { kill } from "./death";
import { centerX, overlaps, type Box } from "./physics";
import { findSpot, heldBody, tramBox } from "./props";
import { corpseSize, emit, type Game } from "./state";
import type { ZoneKind } from "./level/level";

const shrink = (b: Box, d = 0.05): Box => ({ x: b.x + d, y: b.y + d, w: b.w - 2 * d, h: b.h - 2 * d });

export const inZone = (g: Game, kind: ZoneKind, box: Box = g.player) =>
  g.level.zones.some((z) => z.kind === kind && overlaps(z, box));

export function updateTram(g: Game) {
  const m = g.level.machines.tram,
    t = g.tram;
  if (!m || !t) return;
  t.timer++;
  switch (t.phase) {
    case "away": {
      const wait = t.trips ? TRAM_AWAY_TICKS : TRAM_FIRST_TICKS;
      if (t.timer === wait - TRAM_BELL_TICKS) emit(g, { type: "tramBell" });
      if (t.timer >= wait) {
        t.phase = "arriving";
        t.timer = 0;
        t.trips++;
      }
      return;
    }
    case "arriving":
      t.x = Math.min(m.stopX, t.x + TRAM_SPEED * STEP);
      sweep(g, 1);
      if (t.x >= m.stopX) {
        t.phase = "stopped";
        t.timer = 0;
      }
      return;
    case "stopped":
      if (t.timer >= TRAM_DWELL_TICKS) {
        t.phase = "leaving";
        t.timer = 0;
        emit(g, { type: "tramBell" });
      }
      return;
    case "leaving":
      t.x = Math.max(m.hiddenX, t.x - TRAM_SPEED * STEP);
      sweep(g, -1);
      if (t.x <= m.hiddenX) {
        t.phase = "away";
        t.timer = 0;
      }
      return;
  }
}

/** A moving tram flings props and bodies, and ends any android in the way. */
function sweep(g: Game, dir: 1 | -1) {
  const box = tramBox(g);
  if (!box) return;
  const deadly = shrink(box);
  if (g.phase === "alive" && overlaps(deadly, g.player))
    kill(g, "tram", { fling: { vx: TRAM_FLING.vx * dir, vy: TRAM_FLING.vy } });
  for (const b of g.bodies)
    if (!b.held && !b.lifted && overlaps(deadly, b)) {
      b.vx = TRAM_FLING.vx * dir;
      b.vy = TRAM_FLING.vy;
      b.grounded = false;
      // Push it clear of the tram's front so it isn't swept every tick.
      b.x = dir > 0 ? Math.max(b.x, box.x + box.w + 0.02) : Math.min(b.x, box.x - b.w - 0.02);
    }
}

export function compactorBox(g: Game): Box | null {
  const m = g.level.machines.compactor;
  return m ? { x: m.x, y: m.top, w: m.w, h: m.floor - m.top } : null;
}

/** Starts a slam now if the compactor is idle. */
export function runCompactor(g: Game) {
  const c = g.compactor;
  if (!c || c.phase !== "idle") return false;
  c.phase = "warning";
  c.timer = 0;
  emit(g, { type: "compactorWarn" });
  return true;
}

export function updateCompactor(g: Game) {
  const m = g.level.machines.compactor,
    c = g.compactor;
  if (!m || !c) return;
  c.timer++;
  switch (c.phase) {
    case "idle":
      if (c.timer >= COMPACTOR_IDLE_TICKS) runCompactor(g);
      return;
    case "warning":
      if (c.timer >= COMPACTOR_WARN_TICKS) {
        c.phase = "slamming";
        c.timer = 0;
      }
      return;
    case "slamming":
      c.plate = Math.min(m.floor, c.plate + COMPACTOR_SLAM_SPEED);
      if (c.plate >= m.floor) {
        crush(g);
        c.phase = "holding";
        c.timer = 0;
      }
      return;
    case "holding":
      if (c.timer >= COMPACTOR_HOLD_TICKS) {
        c.phase = "rising";
        c.timer = 0;
      }
      return;
    case "rising":
      c.plate = Math.max(m.top, c.plate - COMPACTOR_RISE_SPEED);
      if (c.plate <= m.top) {
        c.phase = "idle";
        c.timer = 0;
      }
      return;
  }
}

/** Everything under the plate becomes a cube. Including you. */
function crush(g: Game) {
  const m = g.level.machines.compactor!,
    box = compactorBox(g)!;
  emit(g, { type: "compactorSlam" });
  const cubeAt = (cx: number) => Math.min(m.x + m.w - 0.4, Math.max(m.x + 0.4, cx));
  const victims = g.bodies.filter((b) => !b.lifted && overlaps(box, b) && !b.held);
  const p = g.player;
  const playerCaught = g.phase === "alive" && overlaps(shrink(box, 0.02), p);
  if (playerCaught) {
    const held = heldBody(g);
    if (held) victims.push(held);
  }
  for (const b of victims) {
    const cx = cubeAt(centerX(b));
    const size = b.kind === "corpse" ? corpseSize("cube") : PROP_SIZES.cube;
    if (b.kind === "corpse") b.pose = "cube";
    else b.kind = "cube";
    b.w = size.w;
    b.h = size.h;
    const spot = findSpot(g, size.w, size.h, cx, m.floor);
    b.x = spot?.x ?? cx - size.w / 2;
    b.y = spot?.y ?? m.floor - size.h;
    b.vx = 0;
    b.vy = 0;
  }
  if (playerCaught)
    kill(g, "compactor", { pose: "cube", at: { x: cubeAt(centerX(p)), y: m.floor } });
}

/** Zone deaths, bonks and falls: checked after movement each tick. */
export function checkHazards(g: Game, fall: number | null) {
  if (g.phase !== "alive") return;
  const p = g.player;
  if (inZone(g, "canal")) return kill(g, "canal");
  if (p.vy > 0 && inZone(g, "fryer")) return kill(g, "fryer");
  const recent = p.bonks.filter((b) => g.ticks - b.tick <= BONK_WINDOW);
  p.bonks = recent;
  if (recent.length >= GROUP_HUG_BONKS)
    return kill(g, "bonk", { bonks: recent.length, bonkKind: "corpse" });
  const last = recent.at(-1);
  if (last && last.tick === g.ticks && last.speed >= BONK_SPEED)
    return kill(g, "bonk", { bonks: recent.length, bonkKind: last.kind });
  if (fall !== null) {
    const lethal = p.lifted === "crane" ? CRANE_FALL : FALL_DEATH;
    if (fall >= lethal) return kill(g, "fall", { fall });
    p.lifted = null;
  }
}


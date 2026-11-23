import {
  BONK_SPEED,
  BONK_WINDOW,
  COMPACTOR_HOLD_TICKS,
  COMPACTOR_IDLE_TICKS,
  COMPACTOR_RISE_SPEED,
  COMPACTOR_SLAM_SPEED,
  COMPACTOR_WARN_TICKS,
  CRANE_IDLE_TICKS,
  CRANE_SPEED,
  VENDING_DOWN_TICKS,
  VENDING_TIP_TICKS,
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
import { bottom, centerX, overlaps, type Box } from "./physics";
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


/** The vending machine tips over after enough shaking, towards whoever shook it. */
export function vendingFallZone(g: Game): Box | null {
  const m = g.level.machines.vending,
    v = g.vending;
  if (!m || !v) return null;
  return v.dir > 0
    ? { x: m.x + 0.3, y: m.y - 1.3, w: 2.2, h: 1.3 }
    : { x: m.x - 2.5, y: m.y - 1.3, w: 2.2, h: 1.3 };
}

export function updateVending(g: Game) {
  const v = g.vending;
  if (!v) return;
  v.timer++;
  if (v.phase === "tipping" && v.timer >= VENDING_TIP_TICKS) {
    v.phase = "down";
    v.timer = 0;
    emit(g, { type: "thud" });
    const zone = vendingFallZone(g)!;
    if (g.phase === "alive" && overlaps(zone, g.player)) kill(g, "vending");
  } else if (v.phase === "down" && v.timer >= VENDING_DOWN_TICKS) {
    v.phase = "up";
    v.shakes = 0;
    v.timer = 0;
  }
}

/**
 * The magnet crane: lowers at pickX, lifts anything metal (props, bodies and
 * androids), carries it along the gantry and lets go over the scrap pile.
 */
export function updateCrane(g: Game) {
  const m = g.level.machines.crane,
    c = g.crane;
  if (!m || !c) return;
  const p = g.player;
  c.timer++;
  const lowest = m.groundY - 1.25;
  switch (c.phase) {
    case "idle":
      if (c.timer >= CRANE_IDLE_TICKS) {
        c.phase = "lowering";
        c.timer = 0;
      }
      break;
    case "lowering":
      c.y = Math.min(lowest, c.y + CRANE_SPEED);
      if (c.y >= lowest) {
        // Grab: everything near the ground under the magnet.
        for (const b of g.bodies)
          if (
            !b.held &&
            !b.lifted &&
            Math.abs(centerX(b) - c.x) <= 0.8 &&
            bottom(b) >= m.groundY - 1.5 &&
            c.cargo.length < 4
          ) {
            b.lifted = true;
            c.cargo.push(b.id);
          }
        if (g.phase === "alive" && Math.abs(centerX(p) - c.x) <= 0.6 && bottom(p) >= m.groundY - 0.3 && !p.climbing) {
          c.player = true;
          p.lifted = "crane";
          p.vx = 0;
          p.vy = 0;
        }
        emit(g, { type: "thud" });
        c.phase = "lifting";
        c.timer = 0;
      }
      break;
    case "lifting":
      c.y = Math.max(m.liftY, c.y - CRANE_SPEED);
      if (c.y <= m.liftY) c.phase = "moving";
      break;
    case "moving":
      c.x = Math.max(m.dropX, c.x - CRANE_SPEED);
      if (c.x <= m.dropX) {
        // Let go of the android first, so it doesn't ride down on the cargo.
        if (c.player) {
          c.player = false;
          p.peak = bottom(p);
          p.grounded = false;
        }
        c.phase = "dropping";
        c.timer = 0;
      }
      break;
    case "dropping":
      if (c.timer >= 30) {
        for (const id of c.cargo) {
          const b = g.bodies.find((b) => b.id === id);
          if (b) {
            b.lifted = false;
            b.grounded = false;
            b.vy = 0;
          }
        }
        c.cargo = [];
        c.phase = "returning";
      }
      break;
    case "returning":
      c.x = Math.min(m.pickX, c.x + CRANE_SPEED);
      if (c.x >= m.pickX) {
        c.phase = "idle";
        c.timer = 0;
      }
      break;
  }
  // Hang the cargo under the magnet: the android first, then everything else.
  let y = c.y;
  if (c.player && g.phase === "alive") {
    p.x = c.x - p.w / 2;
    p.y = y;
    p.peak = bottom(p);
  } else if (c.player) c.player = false;
  if (c.player || c.phase === "dropping") y += p.h;
  for (const id of c.cargo) {
    const b = g.bodies.find((b) => b.id === id);
    if (!b) continue;
    b.x = c.x - b.w / 2;
    b.y = y;
    b.vx = 0;
    b.vy = 0;
    y += b.h;
  }
}

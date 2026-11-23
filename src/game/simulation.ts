import {
  AIR_ACCEL,
  CLIMB_SPEED,
  COYOTE_TICKS,
  DROP_THROUGH_TICKS,
  GRAB_REACH,
  GRAVITY,
  GROUND_ACCEL,
  GROUND_DECEL,
  JUMP_BUFFER_TICKS,
  JUMP_CUT,
  JUMP_SPEED,
  LADDER_JUMP,
  PLAYER_H,
  PLAYER_W,
  PROP_FRICTION,
  PROP_SIZES,
  STEP,
  THROW_FORWARD,
  THROW_UP,
  WALK_SPEED,
} from "./balance";
import { buildBlock } from "./level/block";
import { isLadder, isPlatform, type Level, type PropKind } from "./level/level";
import {
  bottom,
  centerX,
  clampVelocity,
  isFree,
  moveX,
  moveY,
  overlaps,
  type Box,
} from "./physics";

// The simulation is authoritative and free of React and DOM. Input arrives as
// typed commands, and tick() advances one fixed 1/60 s step.
export type Direction = "left" | "right" | "up" | "down";
export type Command =
  | { type: "move"; dir: Direction; pressed: boolean; source?: string }
  | { type: "jump"; pressed: boolean }
  | { type: "grab" }
  | { type: "clear" };

export type Body = Box & {
  id: number;
  kind: PropKind;
  vx: number;
  vy: number;
  grounded: boolean;
  held: boolean;
};

export type Player = Box & {
  vx: number;
  vy: number;
  facing: 1 | -1;
  grounded: boolean;
  coyote: number;
  climbing: boolean;
  dropTicks: number;
  /** True once the current jump can no longer be shortened. */
  jumpCut: boolean;
  holding: number | null;
};

export function createGame(level: Level = buildBlock()) {
  const player: Player = {
    x: level.spawn.x - PLAYER_W / 2,
    y: level.spawn.y - PLAYER_H,
    w: PLAYER_W,
    h: PLAYER_H,
    vx: 0,
    vy: 0,
    facing: 1,
    grounded: true,
    coyote: 0,
    climbing: false,
    dropTicks: 0,
    jumpCut: true,
    holding: null,
  };
  const bodies: Body[] = level.props.map((p, id) => {
    const size = PROP_SIZES[p.kind];
    return {
      id,
      kind: p.kind,
      x: p.x - size.w / 2,
      y: p.y - size.h,
      ...size,
      vx: 0,
      vy: 0,
      grounded: true,
      held: false,
    };
  });
  return {
    level,
    ticks: 0,
    /** Deaths attempted so far. Always 0 until Chunk 2. */
    attempts: 0,
    player,
    bodies,
    input: {
      held: [] as { dir: Direction; source: string }[],
      jumpHeld: false,
      jumpBuffer: 0,
      grabQueued: false,
    },
  };
}
export type Game = ReturnType<typeof createGame>;

const DIRECTIONS = new Set<Direction>(["left", "right", "up", "down"]);

export function command(g: Game, c: Command) {
  const input = g.input;
  switch (c.type) {
    case "clear":
      input.held.length = 0;
      input.jumpHeld = false;
      input.jumpBuffer = 0;
      input.grabQueued = false;
      return;
    case "move": {
      if (!DIRECTIONS.has(c.dir) || typeof c.pressed !== "boolean") return;
      const source = c.source ?? c.dir;
      input.held = input.held.filter((h) => h.source !== source);
      if (c.pressed) input.held.push({ dir: c.dir, source });
      return;
    }
    case "jump":
      if (typeof c.pressed !== "boolean") return;
      if (c.pressed && !input.jumpHeld) input.jumpBuffer = JUMP_BUFFER_TICKS;
      input.jumpHeld = c.pressed;
      return;
    case "grab":
      input.grabQueued = true;
      return;
  }
}

/** The most recently pressed of two opposing directions wins. */
function axis(g: Game, neg: Direction, pos: Direction) {
  for (let i = g.input.held.length - 1; i >= 0; i--) {
    const d = g.input.held[i].dir;
    if (d === neg) return -1;
    if (d === pos) return 1;
  }
  return 0;
}

export const heldBody = (g: Game) =>
  g.player.holding === null
    ? null
    : (g.bodies.find((b) => b.id === g.player.holding) ?? null);

const approach = (v: number, target: number, rate: number) =>
  v < target ? Math.min(target, v + rate) : Math.max(target, v - rate);

/** Ladder tiles in the player's centre column, over the player's height. */
function ladderBeside(g: Game) {
  const p = g.player,
    col = Math.floor(centerX(p));
  for (let y = Math.floor(p.y); y <= Math.floor(bottom(p) - 0.01); y++)
    if (isLadder(g.level, col, y)) return col;
  return null;
}

function updatePlayer(g: Game) {
  const p = g.player,
    level = g.level,
    input = g.input;
  const h = axis(g, "left", "right"),
    v = axis(g, "up", "down");
  if (h && !p.climbing) p.facing = h as 1 | -1;
  if (input.jumpBuffer > 0) input.jumpBuffer--;
  if (p.dropTicks > 0) p.dropTicks--;

  // Ladders: up beside a ladder, or down at a ladder top, starts climbing.
  const beside = ladderBeside(g),
    below = Math.floor(bottom(p) + 0.05),
    underCol = Math.floor(centerX(p));
  if (!p.climbing) {
    if (v < 0 && beside !== null) p.climbing = true;
    else if (v > 0 && p.grounded && isLadder(level, underCol, below))
      p.climbing = true;
    else if (v > 0 && p.grounded && isPlatform(level, underCol, below))
      p.dropTicks = DROP_THROUGH_TICKS;
  } else if ((h && !v) || (beside === null && !isLadder(level, underCol, below)))
    p.climbing = false;

  if (p.climbing) {
    const col = beside ?? underCol;
    p.x = col + 0.5 - p.w / 2;
    p.vx = 0;
    p.vy = v * CLIMB_SPEED;
    if (input.jumpBuffer > 0) {
      p.climbing = false;
      p.vy = -JUMP_SPEED * LADDER_JUMP;
      p.jumpCut = false;
      input.jumpBuffer = 0;
    }
  } else {
    const target = h * WALK_SPEED,
      rate =
        (p.grounded ? (h ? GROUND_ACCEL : GROUND_DECEL) : AIR_ACCEL) * STEP;
    p.vx = approach(p.vx, target, rate);
    if (input.jumpBuffer > 0 && (p.grounded || p.coyote > 0)) {
      p.vy = -JUMP_SPEED;
      p.jumpCut = false;
      p.coyote = 0;
      p.grounded = false;
      input.jumpBuffer = 0;
    }
    if (!input.jumpHeld && !p.jumpCut && p.vy < 0) {
      p.vy *= JUMP_CUT;
      p.jumpCut = true;
    }
    p.vy += GRAVITY * STEP;
  }
  clampVelocity(p);

  if (moveX(level, p, p.vx * STEP)) p.vx = 0;
  const hit = moveY(level, p, p.vy * STEP, {
    ignorePlatforms: p.dropTicks > 0,
    ignoreLadderTops: p.climbing || p.dropTicks > 0,
    tops: g.bodies.filter((b) => !b.held),
  });
  p.grounded = hit === "floor";
  if (hit) p.vy = 0;
  if (hit === "floor") {
    p.climbing = false;
    p.jumpCut = true;
  }
  p.coyote = p.grounded ? COYOTE_TICKS : Math.max(0, p.coyote - 1);
}

/** Where a held prop rides: centred on top of the player's head. */
function carryPosition(p: Player, b: Body) {
  return { x: centerX(p) - b.w / 2, y: p.y - b.h + 0.05 };
}

/**
 * Puts a released prop at the first free spot. The last candidate sits inside
 * the player's own box, which is always free and larger than every prop.
 */
function place(g: Game, b: Body, candidates: { x: number; y: number }[]) {
  const p = g.player;
  for (const c of [
    ...candidates,
    { x: centerX(p) - b.w / 2, y: bottom(p) - b.h },
  ])
    if (isFree(g.level, { ...b, ...c })) {
      b.x = c.x;
      b.y = c.y;
      return;
    }
}

function grabOrThrow(g: Game) {
  const p = g.player,
    held = heldBody(g),
    down = axis(g, "up", "down");
  if (held) {
    held.held = false;
    p.holding = null;
    if (down > 0) {
      const x = p.facing > 0 ? p.x + p.w + 0.05 : p.x - held.w - 0.05;
      place(g, held, [{ x, y: bottom(p) - held.h }]);
      held.vx = 0;
      held.vy = 0;
      return;
    }
    place(g, held, [carryPosition(p, held)]);
    const t = down < 0 ? THROW_UP : THROW_FORWARD;
    held.vx = p.facing * t.vx + p.vx * t.carry;
    held.vy = t.vy;
    held.grounded = false;
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
    if (b.held || !overlaps(reach, b)) continue;
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
}

function updateBodies(g: Game) {
  // Lowest first, so a stack settles from the bottom up in one tick.
  const loose = g.bodies
    .filter((b) => !b.held)
    .sort((a, b) => bottom(b) - bottom(a) || a.id - b.id);
  for (const b of loose) {
    b.vy += GRAVITY * STEP;
    if (b.grounded) b.vx = approach(b.vx, 0, PROP_FRICTION * STEP);
    clampVelocity(b);
    if (moveX(g.level, b, b.vx * STEP)) b.vx *= -0.2;
    const hit = moveY(g.level, b, b.vy * STEP, { tops: loose });
    b.grounded = hit === "floor";
    if (hit) b.vy = 0;
  }
  const held = heldBody(g);
  if (held) Object.assign(held, carryPosition(g.player, held));
}

export function tick(g: Game) {
  g.ticks++;
  updatePlayer(g);
  if (g.input.grabQueued) {
    g.input.grabQueued = false;
    grabOrThrow(g);
  }
  updateBodies(g);
}

export const seconds = (g: Game) => g.ticks * STEP;

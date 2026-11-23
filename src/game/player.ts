import {
  AIR_ACCEL,
  CLIMB_SPEED,
  COYOTE_TICKS,
  DROP_THROUGH_TICKS,
  GRAVITY,
  GROUND_ACCEL,
  GROUND_DECEL,
  JUMP_BUFFER_TICKS,
  JUMP_CUT,
  JUMP_SPEED,
  LADDER_JUMP,
  STEP,
  WALK_SPEED,
} from "./balance";
import { isLadder, isPlatform } from "./level/level";
import { bottom, centerX, clampVelocity, isFree, moveX, moveY } from "./physics";
import { axis } from "./input";
import { tops } from "./props";
import { emit, type Game } from "./state";

const approach = (v: number, target: number, rate: number) =>
  v < target ? Math.min(target, v + rate) : Math.max(target, v - rate);

// A player whose shoulder overlaps the ladder can catch it from the side.
const LADDER_REACH = 0.3;
const HIGH_THROW_CHORD_TICKS = 5;

function ladderNear(g: Game, top: number, bottomRow: number, reach = 0) {
  const p = g.player;
  const x = centerX(p);
  const col = Math.floor(x);
  // Check the column under the player first, then the nearest adjacent column.
  const outerCol = Math.floor(x + (x - col < 0.5 ? -reach : reach));
  for (let y = top; y <= bottomRow; y++) {
    if (isLadder(g.level, col, y)) return col;
  }
  if (outerCol !== col && isFree(g.level, { ...p, x: outerCol + 0.5 - p.w / 2 })) {
    for (let y = top; y <= bottomRow; y++) {
      if (isLadder(g.level, outerCol, y)) return outerCol;
    }
  }
  return null;
}

/**
 * Moves the player one tick. Returns the fall distance when the player lands,
 * so the caller can decide whether the landing was fatal.
 */
export function updatePlayer(g: Game): number | null {
  const p = g.player,
    level = g.level,
    input = g.input;
  const h = axis(g, "left", "right");
  const vertical = axis(g, "up", "down");
  const usingThrowModifier = input.grabQueued && p.holding !== null && vertical !== 0;
  if (usingThrowModifier && vertical < 0) input.upBuffer = 0;
  // When carrying, allow a brief Up+Q chord before committing to a jump.
  const waitingForThrow = p.holding !== null && vertical < 0 &&
    input.upBuffer > JUMP_BUFFER_TICKS - HIGH_THROW_CHORD_TICKS;
  const v = usingThrowModifier || waitingForThrow ? 0 : vertical;

  if (h && !p.climbing) p.facing = h as 1 | -1;
  if (input.jumpBuffer > 0) input.jumpBuffer--;
  if (p.dropTicks > 0) p.dropTicks--;

  const below = Math.floor(bottom(p) + 0.05);
  const underCol = Math.floor(centerX(p));
  const beside = p.climbing || v < 0
    ? ladderNear(g, Math.floor(p.y), Math.floor(bottom(p) - 0.01), p.climbing ? 0 : LADDER_REACH)
    : null;
  let ladder = beside ?? underCol;
  if (!p.climbing) {
    if (v < 0 && beside !== null) p.climbing = true;
    else if (v > 0 && p.grounded) {
      const downLadder = ladderNear(g, below, below, LADDER_REACH);
      if (downLadder !== null) {
        p.climbing = true;
        ladder = downLadder;
      } else if (isPlatform(level, underCol, below)) p.dropTicks = DROP_THROUGH_TICKS;
    }
  } else if ((h && !vertical) || (beside === null && !isLadder(level, underCol, below))) {
    p.climbing = false;
  }

  if (p.climbing) {
    input.upBuffer = 0;
    const col = ladder;
    p.x = col + 0.5 - p.w / 2;
    p.vx = 0;
    p.vy = v * CLIMB_SPEED;
    if (input.jumpBuffer > 0) {
      p.climbing = false;
      p.vy = -JUMP_SPEED * LADDER_JUMP;
      p.jumpCut = false;
      input.jumpBuffer = 0;
      emit(g, { type: "jump" });
    }
  } else {
    const target = h * WALK_SPEED,
      rate = (p.grounded ? (h ? GROUND_ACCEL : GROUND_DECEL) : AIR_ACCEL) * STEP;
    p.vx = approach(p.vx, target, rate);
    const jumpUp = input.upBuffer > 0 && !waitingForThrow && vertical <= 0;
    if ((input.jumpBuffer > 0 || jumpUp) && (p.grounded || p.coyote > 0)) {
      p.vy = -JUMP_SPEED;
      p.jumpCut = false;
      p.coyote = 0;
      p.grounded = false;
      input.jumpBuffer = 0;
      input.upBuffer = 0;
      emit(g, { type: "jump" });
    }
    if (!input.jumpHeld && vertical >= 0 && !p.jumpCut && p.vy < 0) {
      p.vy *= JUMP_CUT;
      p.jumpCut = true;
    }
    p.vy += GRAVITY * STEP;
  }
  if (input.upBuffer > 0) input.upBuffer--;
  clampVelocity(p);

  if (moveX(level, p, p.vx * STEP)) p.vx = 0;
  const wasGrounded = p.grounded;
  const hit = moveY(level, p, p.vy * STEP, {
    ignorePlatforms: p.dropTicks > 0,
    ignoreLadderTops: p.climbing || p.dropTicks > 0,
    tops: tops(g),
  });
  p.grounded = hit === "floor";
  if (hit) p.vy = 0;
  let fall: number | null = null;
  if (hit === "floor") {
    p.climbing = false;
    p.jumpCut = true;
    if (!wasGrounded) {
      fall = bottom(p) - p.peak;
      if (fall > 0.6) emit(g, { type: "land" });
    }
  }
  p.coyote = p.grounded ? COYOTE_TICKS : Math.max(0, p.coyote - 1);
  if (p.grounded || p.climbing) p.peak = bottom(p);
  else p.peak = Math.min(p.peak, bottom(p));

  // Idle time, for being bored to death.
  const still = !h && !vertical && !input.jumpHeld && p.grounded && Math.abs(p.vx) < 0.01;
  p.idleTicks = still ? p.idleTicks + 1 : 0;
  return fall;
}

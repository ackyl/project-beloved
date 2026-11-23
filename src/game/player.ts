import {
  AIR_ACCEL,
  CLIMB_SPEED,
  COYOTE_TICKS,
  DROP_THROUGH_TICKS,
  GRAVITY,
  GROUND_ACCEL,
  GROUND_DECEL,
  JUMP_CUT,
  JUMP_SPEED,
  LADDER_JUMP,
  STEP,
  WALK_SPEED,
} from "./balance";
import { isLadder, isPlatform } from "./level/level";
import { bottom, centerX, clampVelocity, moveX, moveY } from "./physics";
import { axis } from "./input";
import { tops } from "./props";
import { emit, type Game } from "./state";

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

/**
 * Moves the player one tick. Returns the fall distance when the player lands,
 * so the caller can decide whether the landing was fatal.
 */
export function updatePlayer(g: Game): number | null {
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
    else if (v > 0 && p.grounded && isLadder(level, underCol, below)) p.climbing = true;
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
      emit(g, { type: "jump" });
    }
  } else {
    const target = h * WALK_SPEED,
      rate = (p.grounded ? (h ? GROUND_ACCEL : GROUND_DECEL) : AIR_ACCEL) * STEP;
    p.vx = approach(p.vx, target, rate);
    if (input.jumpBuffer > 0 && (p.grounded || p.coyote > 0)) {
      p.vy = -JUMP_SPEED;
      p.jumpCut = false;
      p.coyote = 0;
      p.grounded = false;
      input.jumpBuffer = 0;
      emit(g, { type: "jump" });
    }
    if (!input.jumpHeld && !p.jumpCut && p.vy < 0) {
      p.vy *= JUMP_CUT;
      p.jumpCut = true;
    }
    p.vy += GRAVITY * STEP;
  }
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
  const still = !h && !v && !input.jumpHeld && p.grounded && Math.abs(p.vx) < 0.01;
  p.idleTicks = still ? p.idleTicks + 1 : 0;
  return fall;
}

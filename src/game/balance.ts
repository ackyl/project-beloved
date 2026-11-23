// Central tunables. Distances are in tiles, speeds in tiles per second.
export const STEP = 1 / 60;

export const GRAVITY = 60;
export const MAX_FALL = 18;
/** Fastest upward speed. Per-tick travel stays under half a tile, so nothing tunnels. */
export const MAX_RISE = 22;
export const MAX_HORIZONTAL = 18;

export const PLAYER_W = 0.7;
export const PLAYER_H = 1.15;
export const WALK_SPEED = 6.5;
export const GROUND_ACCEL = 75;
export const GROUND_DECEL = 90;
export const AIR_ACCEL = 45;
/** Gives an apex of about 3.7 tiles, so 3-tile ledges are reachable. */
export const JUMP_SPEED = 21;
/** Releasing jump while rising multiplies upward speed by this. */
export const JUMP_CUT = 0.45;
export const COYOTE_TICKS = 6;
export const JUMP_BUFFER_TICKS = 7;
export const LADDER_JUMP = 0.75;
export const CLIMB_SPEED = 5;
export const DROP_THROUGH_TICKS = 12;

export const PROP_SIZES = {
  crate: { w: 0.7, h: 0.7 },
  pot: { w: 0.55, h: 0.55 },
  tire: { w: 0.7, h: 0.45 },
} as const;
export const PROP_FRICTION = 30;
export const GRAB_REACH = 0.7;
export const THROW_FORWARD = { vx: 10, vy: -7, carry: 0.5 };
export const THROW_UP = { vx: 3, vy: -15, carry: 0.3 };

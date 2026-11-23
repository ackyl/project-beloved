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
  cube: { w: 0.5, h: 0.5 },
} as const;
export const PROP_FRICTION = 30;
export const GRAB_REACH = 0.7;
export const THROW_FORWARD = { vx: 10, vy: -7, carry: 0.5 };
export const THROW_UP = { vx: 0, vy: -15, carry: 0.3 };

// Death and replication (Chunk 2).
/** Falls of at least this many tiles are fatal. */
export const FALL_DEATH = 7.5;
/** The crane slams you down harder: this fall is enough after a magnet ride. */
export const CRANE_FALL = 3.5;
/** A body landing on you this fast is fatal on its own. */
export const BONK_SPEED = 11;
/** Bonks within this many ticks count together; three is a Group Hug. */
export const BONK_WINDOW = 30;
export const GROUP_HUG_BONKS = 3;
/** Ticks from death to the replicator printing. Skippable after SKIP_AFTER. */
export const DEATH_TICKS = 96;
export const SKIP_AFTER = 18;
/** Ticks the fresh copy spends being printed. Total cycle stays under 3 s. */
export const PRINT_TICKS = 36;
export const CORPSE_CAP = 40;
export const CORPSE_SIZES = {
  upright: { w: 0.7, h: 1.15 },
  upside: { w: 0.7, h: 1.15 },
  flat: { w: 1.2, h: 0.6 },
  cube: { w: 0.6, h: 0.6 },
} as const;

// Machines.
export const TRAM_AWAY_TICKS = 720;
export const TRAM_FIRST_TICKS = 300;
export const TRAM_BELL_TICKS = 90;
export const TRAM_DWELL_TICKS = 240;
export const TRAM_SPEED = 11;
export const TRAM_FLING = { vx: 9, vy: -8 };
export const COMPACTOR_IDLE_TICKS = 540;
export const COMPACTOR_WARN_TICKS = 90;
export const COMPACTOR_SLAM_SPEED = 0.6;
export const COMPACTOR_HOLD_TICKS = 45;
export const COMPACTOR_RISE_SPEED = 0.1;

// Chunk 3: stunts, machines and neighbours.
export const INTERACT_RANGE = { x: 1.4, y: 1.3 };
export const SOLAR_TICKS = 100;
export const DRIP_TICKS = 240;
export const BORED_TICKS = 60 * 180;
export const PLANT_TICKS = 180;
export const ZIP_TICKS = 80;
/** Pigeons gather for this long; moving scares them off. Then they lift. */
export const PIGEON_GATHER_TICKS = 90;
export const PIGEON_LIFT_SPEED = 5;
export const VENDING_SHAKES = 4;
export const VENDING_TIP_TICKS = 18;
export const VENDING_DOWN_TICKS = 360;
export const KINDNESS_TICKS = 45;
export const CRANE_IDLE_TICKS = 600;
export const CRANE_SPEED = 0.09;
export const SPEECH_TICKS = 210;

// Chunk 4: the twist.
/** Unique board deaths before the replicator runs low on feedstock. */
export const TWIST_AT = 12;
/** Length of the dark stretch while the neighbours rebuild you. */
export const TWIST_DARK_TICKS = 60 * 7;
export const PARTY_TICKS = 60 * 12;

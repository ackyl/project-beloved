import {
  isLadderTop,
  isPlatform,
  isSolid,
  type Level,
} from "./level/level";
import { MAX_FALL, MAX_HORIZONTAL, MAX_RISE } from "./balance";

// Axis-aligned boxes against the tile grid. x and y are the top-left corner.
// Per-tick travel is capped below half a tile, so a single leading-edge check
// per axis can never skip a tile.
export type Box = { x: number; y: number; w: number; h: number };
export const EPS = 1e-4;

export const bottom = (b: Box) => b.y + b.h;
export const centerX = (b: Box) => b.x + b.w / 2;
export const overlaps = (a: Box, b: Box) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

const cols = (b: Box) => [Math.floor(b.x + EPS), Math.floor(b.x + b.w - EPS)];
const rows = (b: Box) => [Math.floor(b.y + EPS), Math.floor(b.y + b.h - EPS)];

/** True when the box overlaps no solid tile. */
export function isFree(level: Level, b: Box) {
  const [c0, c1] = cols(b),
    [r0, r1] = rows(b);
  for (let y = r0; y <= r1; y++)
    for (let x = c0; x <= c1; x++) if (isSolid(level, x, y)) return false;
  return true;
}

export function clampVelocity(v: { vx: number; vy: number }) {
  v.vx = Math.max(-MAX_HORIZONTAL, Math.min(MAX_HORIZONTAL, v.vx));
  v.vy = Math.max(-MAX_RISE, Math.min(MAX_FALL, v.vy));
}

/** Moves horizontally. Returns true when a wall stopped the box. */
export function moveX(level: Level, b: Box, dx: number) {
  if (!dx) return false;
  const nx = b.x + dx,
    [r0, r1] = rows(b);
  const col = dx > 0 ? Math.floor(nx + b.w - EPS) : Math.floor(nx + EPS);
  for (let y = r0; y <= r1; y++)
    if (isSolid(level, col, y)) {
      b.x = dx > 0 ? col - b.w : col + 1;
      return true;
    }
  b.x = nx;
  return false;
}

export type Surfaces = {
  /** Ignore `=` and `_` platforms (dropping through). */
  ignorePlatforms?: boolean;
  /** Ignore ladder tops (climbing). */
  ignoreLadderTops?: boolean;
  /** Other boxes whose tops can be stood on. */
  tops?: Box[];
};

/**
 * Moves vertically. Returns "floor" when the box landed on something,
 * "ceiling" when it hit its head, or null.
 */
export function moveY(level: Level, b: Box, dy: number, s: Surfaces = {}) {
  if (!dy) return null;
  const prevBottom = bottom(b),
    ny = b.y + dy;
  const [c0, c1] = cols(b);
  if (dy < 0) {
    const row = Math.floor(ny + EPS);
    for (let x = c0; x <= c1; x++)
      if (isSolid(level, x, row)) {
        b.y = row + 1;
        return "ceiling";
      }
    b.y = ny;
    return null;
  }
  const newBottom = ny + b.h;
  let surface = Infinity;
  const row = Math.floor(newBottom - EPS);
  for (let x = c0; x <= c1; x++) {
    if (isSolid(level, x, row)) surface = Math.min(surface, row);
    else if (
      prevBottom <= row + EPS &&
      ((!s.ignorePlatforms && isPlatform(level, x, row)) ||
        (!s.ignoreLadderTops && isLadderTop(level, x, row)))
    )
      surface = Math.min(surface, row);
  }
  for (const o of s.tops ?? [])
    if (
      o !== b &&
      b.x < o.x + o.w &&
      b.x + b.w > o.x &&
      prevBottom <= o.y + EPS &&
      newBottom >= o.y
    )
      surface = Math.min(surface, o.y);
  if (surface !== Infinity) {
    b.y = surface - b.h;
    return "floor";
  }
  b.y = ny;
  return null;
}

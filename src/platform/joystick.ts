import type { Direction } from "../game/state";

const DEAD_ZONE = 0.24;
const DIAGONAL_RATIO = 0.6;

/** Convert an offset in joystick radii to one or two movement directions. */
export function joystickDirections(x: number, y: number): Direction[] {
  if (Math.hypot(x, y) < DEAD_ZONE) return [];
  const directions: Direction[] = [];
  if (Math.abs(x) >= Math.abs(y) * DIAGONAL_RATIO)
    directions.push(x < 0 ? "left" : "right");
  if (Math.abs(y) >= Math.abs(x) * DIAGONAL_RATIO)
    directions.push(y < 0 ? "up" : "down");
  return directions;
}

// Tile grid for an authored level. One character per tile, in tile units.
//
//   .  open air (sky)            w  interior wall (open, drawn as wallpaper)
//   #  street or ground (solid)  B  building brick (solid)
//   M  scrap metal (solid)
//   =  one-way platform on air   _  one-way platform on an interior wall
//   H  ladder on air             L  ladder on an interior wall
//
// The top of a ladder column also acts as a one-way platform, so you can stand
// at the top of a ladder and walk off it.
export type PropKind = "crate" | "pot" | "tire";
export type Point = { x: number; y: number };
export type DecorKind =
  | "replicator"
  | "deathBoard"
  | "sofa"
  | "lamp"
  | "plant"
  | "solar"
  | "tank"
  | "antenna"
  | "dumpster"
  | "noodleCart"
  | "vending"
  | "streetLamp"
  | "tramSign"
  | "crane"
  | "compactor"
  | "laundry";
export type Decor = { kind: DecorKind; x: number; y: number; x2?: number; y2?: number };
export interface Level {
  name: string;
  w: number;
  h: number;
  rows: string[];
  /** Where the replicator prints a fresh copy: feet centre, in tiles. */
  spawn: Point;
  /** Props: feet centre, in tiles. */
  props: { kind: PropKind; x: number; y: number }[];
  decor: Decor[];
}

const SOLID = new Set(["#", "B", "M"]);
const PLATFORM = new Set(["=", "_"]);
const LADDER = new Set(["H", "L"]);
export const INTERIOR = new Set(["w", "_", "L"]);

/** Outside the left, right and bottom edges is solid. Above the top is open. */
export function tileAt(level: Level, x: number, y: number) {
  if (x < 0 || x >= level.w || y >= level.h) return "#";
  if (y < 0) return ".";
  return level.rows[y][x];
}
export const isSolid = (l: Level, x: number, y: number) =>
  SOLID.has(tileAt(l, x, y));
export const isLadder = (l: Level, x: number, y: number) =>
  LADDER.has(tileAt(l, x, y));
export const isPlatform = (l: Level, x: number, y: number) =>
  PLATFORM.has(tileAt(l, x, y));
export const isLadderTop = (l: Level, x: number, y: number) =>
  isLadder(l, x, y) && !isLadder(l, x, y - 1);

/** Build a level from equal-length ASCII rows. Used for test rooms. */
export function parseLevel(
  name: string,
  rows: string[],
  spawn: Point,
  props: Level["props"] = [],
  decor: Decor[] = [],
): Level {
  const w = rows[0].length;
  if (rows.some((r) => r.length !== w))
    throw new Error(`${name}: rows must have equal length`);
  return { name, w, h: rows.length, rows, spawn, props, decor };
}

/** Small helper for authoring larger levels with rectangles. */
export class Grid {
  private cells: string[][];
  constructor(
    readonly w: number,
    readonly h: number,
    fill = ".",
  ) {
    this.cells = Array.from({ length: h }, () => Array(w).fill(fill));
  }
  rect(x: number, y: number, w: number, h: number, ch: string) {
    for (let j = y; j < y + h; j++)
      for (let i = x; i < x + w; i++)
        if (i >= 0 && j >= 0 && i < this.w && j < this.h) this.cells[j][i] = ch;
    return this;
  }
  rows() {
    return this.cells.map((r) => r.join(""));
  }
}

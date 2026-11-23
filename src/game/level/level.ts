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
export type PropKind = "crate" | "pot" | "tire" | "cube";
export type Point = { x: number; y: number };
export type DecorKind =
  | "observationBay"
  | "serviceStation"
  | "bulkhead"
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
  | "laundry"
  | "canal"
  | "powerStrip"
  | "powerline"
  | "planterBox"
  | "drip"
  | "mirrors"
  | "compactorButton";
export type Decor = { kind: DecorKind; x: number; y: number; x2?: number; y2?: number };
export type Rect = { x: number; y: number; w: number; h: number };
export type ZoneKind =
  | "fryer"
  | "canal"
  | "solar"
  | "drip"
  | "powerline"
  | "pellCart"
  | "outdoors";
export type Zone = Rect & { kind: ZoneKind };
export type InteractKind =
  | "vending"
  | "powerStrip"
  | "planter"
  | "zipline"
  | "compactorButton"
  | "deathBoard"
  | "neighbour";
export type Interactable = { kind: InteractKind; x: number; y: number; id?: string };
export type NeighbourId = "pell" | "rook" | "bas" | "juniper";
export type NeighbourSpot = { id: NeighbourId; x: number; y: number };
export type Machines = {
  /** Tram on the west street: left edge when stopped, length, height, rail (bottom). */
  tram?: { stopX: number; hiddenX: number; length: number; height: number; rail: number };
  /** Compactor over a pit: plate rests with its bottom at `top`, slams to `floor`. */
  compactor?: { x: number; w: number; top: number; floor: number };
  /** Magnet crane: picks up at pickX, carries along the gantry at liftY, drops at dropX. */
  crane?: { pickX: number; dropX: number; liftY: number; groundY: number };
  /** Zip line from the roof to the tram stop sign. */
  zipline?: { x1: number; y1: number; x2: number; y2: number };
  /** Vending machine footprint (feet centre). */
  vending?: { x: number; y: number };
};
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
  zones: Zone[];
  /** Extra one-way surfaces that are not tiles, like a dumpster lid. */
  ledges: Rect[];
  interactables: Interactable[];
  neighbours: NeighbourSpot[];
  machines: Machines;
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
  return {
    name,
    w,
    h: rows.length,
    rows,
    spawn,
    props,
    decor,
    zones: [],
    ledges: [],
    interactables: [],
    neighbours: [],
    machines: {},
  };
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

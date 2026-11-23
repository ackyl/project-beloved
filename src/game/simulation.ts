import { assays, formulas, researchState, type BaseCommand } from "./research";
import { at, generate, tile } from "./world";
import type { Material, Item, Point } from "./world";

import {
  CARE_INTERVAL,
  FLOAT_SPEED,
  OPEN_TICKS,
  START_CAPACITY,
  STEP,
  STRIKE_TICKS,
  UPGRADE_COST,
  UPGRADE_SLOTS,
} from "./balance";
export const vector = {
  left: [-1, 0],
  right: [1, 0],
  up: [0, -1],
  down: [0, 1],
} as const;
export type Direction = keyof typeof vector;
export type Command =
  | BaseCommand
  | { type: "move"; dir: Direction; pressed: boolean; source?: string }
  | { type: "clear" }
  | { type: "hold"; active: boolean };
export type Impact = {
  x: number;
  y: number;
  dir: Direction;
  tick: number;
  broken: boolean;
  kind: Material;
};
export function createGame(seed = 1703) {
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) seed = 1703;
  return {
    ...researchState(),
    bag: { copper: 0, crystal: 0, bloom: 0 } as Record<Item, number>,
    capacity: START_CAPACITY,
    panelOpen: false,
    holding: false,
    holdTicks: 0,
    note: "",
    noteTick: -1000,
    seed,
    world: generate(seed),
    x: 17.5,
    y: 11.45,
    facing: "right" as Direction,
    held: [] as { dir: Direction; source: string }[],
    ticks: 0,
    nextStrike: 0,
    impact: null as Impact | null,
  };
}
export type Game = ReturnType<typeof createGame>;
export function command(g: Game, c: Command) {
  if (c.type === "clear") {
    g.held.length = 0;
    g.holding = false;
    g.holdTicks = 0;
    return;
  }
  if (c.type === "hold") {
    g.holding = c.active === true && nearPanel(g) && !g.panelOpen;
    if (!g.holding) g.holdTicks = 0;
    return;
  }
  if (c.type !== "move") {
    baseCommand(g, c);
    return;
  }
  if (!Object.hasOwn(vector, c.dir) || typeof c.pressed !== "boolean") return;
  const source = c.source ?? c.dir;
  if (!c.pressed) g.held = g.held.filter((input) => input.source !== source);
  else if (!g.held.some((input) => input.source === source))
    g.held.push({ dir: c.dir, source });
}
export const near = (g: Point, p: Point, r: number) =>
  Math.hypot(g.x - p.x, g.y - p.y) <= r;
export const atHome = (g: Game) =>
  g.x >= 9 && g.x <= 18.6 && g.y >= 8 && g.y < 12;
export const nearPanel = (g: Game) =>
  near(g, { x: g.world.annex.x + 0.15, y: g.world.annex.y + 0.5 }, 1.85);
export function announce(g: Game, message: string) {
  g.note = message;
  g.noteTick = g.ticks;
}
export function tick(g: Game) {
  g.careAge = Math.min(CARE_INTERVAL, g.careAge + 1);
  moveStep(g);
  if (g.holding && nearPanel(g) && !g.panelOpen) {
    if (++g.holdTicks >= OPEN_TICKS) {
      g.panelOpen = true;
      g.holding = false;
      g.holdTicks = 0;
      const a = g.world.annex;
      g.world.cells[a.y * g.world.w + a.x] = tile("empty");
      announce(
        g,
        "The roots lace through the respirator. Three pulses, then a rest.",
      );
    }
  } else {
    g.holdTicks = 0;
    g.holding = false;
  }
  g.world.drops = g.world.drops.filter((drop) => {
    if (!near(g, drop, 0.8)) return true;
    if (drop.item !== "bloom" && g.bag.copper + g.bag.crystal >= g.capacity - 1)
      return true;
    g.bag[drop.item]++;
    announce(
      g,
      drop.item === "bloom"
        ? "Lumen bloom collected. An old signal answers to the east."
        : drop.item === "copper"
          ? "Copper collected."
          : "Prism shard collected.",
    );
    return false;
  });
}
function moveStep(g: Game) {
  g.ticks++;
  const dir = g.held.at(-1)?.dir;
  if (!dir) return;
  g.facing = dir;
  const [dx, dy] = vector[dir];
  const nx = g.x + dx * FLOAT_SPEED * STEP,
    ny = g.y + dy * FLOAT_SPEED * STEP;
  for (const side of [0, -0.21, 0.21]) {
    const tx = Math.floor(nx + dx * 0.22 + Math.abs(dy) * side);
    const ty = Math.floor(ny + dy * 0.22 + Math.abs(dx) * side);
    const target = at(g.world, tx, ty);
    if (target.kind === "empty") continue;
    if (target.kind !== "shell" && g.ticks >= g.nextStrike) {
      g.nextStrike = g.ticks + STRIKE_TICKS;
      target.hp--;
      g.impact = {
        x: tx,
        y: ty,
        dir,
        tick: g.ticks,
        broken: target.hp === 0,
        kind: target.kind,
      };
      if (target.hp === 0) {
        g.world.cells[ty * g.world.w + tx] = tile("empty");
        if (target.kind === "copper" || target.kind === "crystal")
          g.world.drops.push({ x: tx + 0.5, y: ty + 0.5, item: target.kind });
      }
    }
    return;
  }
  g.x = nx;
  g.y = ny;
}

function baseCommand(g: Game, c: BaseCommand) {
  if (!atHome(g)) return;
  switch (c.type) {
    case "test":
      if (!g.bag.bloom || !Object.hasOwn(assays, c.id) || g.tests[c.id]) return;
      g.tests[c.id] = true;
      g.feedback = assays[c.id].result;
      return;
    case "deduce":
      if (
        !Object.hasOwn(formulas, c.id) ||
        !g.tests.repair ||
        !g.tests.resonance ||
        g.learned
      )
        return;
      if (c.id === "support") {
        g.learned = true;
        g.feedback =
          "Both observations fit. A soft, resonant lining could support each breath.";
      } else
        g.feedback =
          c.id === "seal"
            ? "The repaired film still flexed. A rigid seal would prevent it from expanding."
            : "The bloom repeated the tone. A damping agent would have silenced it.";
      return;
    case "craft":
      if (!g.learned || !g.bag.bloom || g.prepared) return;
      g.prepared = true;
      g.feedback = "One dose prepared. The living culture remains in its vial.";
      return;
    case "care":
      if (
        !g.prepared ||
        (g.treated && g.careAge < CARE_INTERVAL && (!g.panelOpen || g.revealed))
      )
        return;
      g.prepared = false;
      g.treated = true;
      g.careAge = 0;
      if (g.panelOpen) {
        g.revealed = true;
        g.feedback =
          "Three breaths, then a rest. Behind the curtain, the monitor repeats the annex respirator’s rhythm. The bloom answers.";
      } else
        g.feedback =
          "The breathing steadies. Three small notes pass between the monitor and the bloom.";
      announce(g, g.feedback);
      return;
    case "upgrade":
      if (g.upgraded || g.bag.copper + g.stores.copper < UPGRADE_COST) return;
      {
        const used = Math.min(UPGRADE_COST, g.bag.copper);
        g.bag.copper -= used;
        g.stores.copper -= UPGRADE_COST - used;
      }
      g.upgraded = true;
      g.capacity += UPGRADE_SLOTS;
      g.feedback = "Pannier extended. Two more mineral slots.";
      return;
    case "stow":
      if (!g.bag.copper && !g.bag.crystal) return;
      for (const mineral of ["copper", "crystal"] as const) {
        g.stores[mineral] += g.bag[mineral];
        g.bag[mineral] = 0;
      }
      g.feedback = "Minerals stowed in the sanctuary.";
      return;
  }
}

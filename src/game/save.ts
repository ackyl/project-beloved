import { CORPSE_SIZES, PROP_SIZES } from "./balance";
import { DEATHS, type CorpsePose, type CorpseTint, type DeathId } from "./data/deaths";
import type { NeighbourId } from "./level/level";
import { isFree } from "./physics";
import { createGame, type Body, type Game } from "./state";

// One versioned, fully local save. Anything that doesn't validate is dropped,
// and a payload that doesn't validate at all gives a fresh game.
export const SAVE_KEY = "project-beloved/save/v1";
export const SAVE_VERSION = 1;

type SavedBody = {
  kind: Body["kind"];
  x: number;
  y: number;
  pose?: CorpsePose;
  tint?: CorpseTint;
  attempt?: number;
};

export type SaveData = {
  v: number;
  attempts: number;
  board: Partial<Record<DeathId, { count: number; first: number }>>;
  carted: number;
  talks: Record<NeighbourId, number>;
  twist: number;
  twistAttempt: number;
  rebuilt: boolean;
  crumbs: boolean;
  bodies: SavedBody[];
};

export function serialize(g: Game): SaveData {
  return {
    v: SAVE_VERSION,
    attempts: g.attempts,
    board: g.board,
    carted: g.carted,
    talks: g.talks,
    // The dark stretch resumes as "feedstock low" so it isn't skipped.
    twist: g.twist === 1.5 ? 1 : g.twist,
    twistAttempt: g.twist === 1.5 ? g.attempts - 1 : g.twistAttempt,
    rebuilt: g.rebuilt,
    crumbs: g.player.crumbs,
    bodies: g.bodies
      .filter((b) => !b.lifted)
      .map((b) => ({
        kind: b.kind,
        x: round(b.x),
        y: round(b.y),
        ...(b.kind === "corpse" ? { pose: b.pose, tint: b.tint, attempt: b.attempt } : {}),
      })),
  };
}

const round = (n: number) => Math.round(n * 1000) / 1000;
const isInt = (n: unknown, min = 0): n is number => Number.isInteger(n) && (n as number) >= min;
const isNum = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n);
const POSES = new Set(Object.keys(CORPSE_SIZES));
const TINTS = new Set(["none", "fried", "wet", "zapped", "melted", "rusty", "leafy"]);
const KINDS = new Set([...Object.keys(PROP_SIZES), "corpse"]);
const IDS = new Set(DEATHS.map((d) => d.id));

/** Builds a game from saved data, or returns null if the payload is unusable. */
export function restore(data: unknown, base: () => Game = createGame): Game | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Partial<SaveData>;
  if (d.v !== SAVE_VERSION || !isInt(d.attempts) || !isInt(d.carted)) return null;
  if (!d.board || typeof d.board !== "object" || !Array.isArray(d.bodies)) return null;
  const g = base();
  g.attempts = d.attempts;
  g.carted = d.carted;
  for (const [id, entry] of Object.entries(d.board))
    if (IDS.has(id as DeathId) && entry && isInt(entry.count, 1) && isInt(entry.first))
      g.board[id as DeathId] = { count: entry.count, first: entry.first };
  if (d.talks && typeof d.talks === "object")
    for (const id of Object.keys(g.talks) as NeighbourId[])
      if (isInt(d.talks[id])) g.talks[id] = d.talks[id];
  if (d.twist === 0 || d.twist === 1 || d.twist === 2) g.twist = d.twist;
  if (isInt(d.twistAttempt)) g.twistAttempt = d.twistAttempt;
  g.rebuilt = d.rebuilt === true;
  g.player.crumbs = d.crumbs === true;
  g.bodies = [];
  for (const b of d.bodies) {
    if (!b || !KINDS.has(b.kind) || !isNum(b.x) || !isNum(b.y)) continue;
    let size: { w: number; h: number };
    const body: Body = { id: g.bodies.length, kind: b.kind, x: b.x, y: b.y, w: 0, h: 0, vx: 0, vy: 0, grounded: false, held: false, bonked: true };
    if (b.kind === "corpse") {
      if (!POSES.has(b.pose as string)) continue;
      size = CORPSE_SIZES[b.pose as CorpsePose];
      body.pose = b.pose;
      body.tint = TINTS.has(b.tint as string) ? b.tint : "none";
      body.attempt = isInt(b.attempt) ? b.attempt : 0;
    } else size = PROP_SIZES[b.kind as keyof typeof PROP_SIZES];
    body.w = size.w;
    body.h = size.h;
    if (b.x < -1 || b.x > g.level.w + 1 || b.y < -2 || b.y > g.level.h) continue;
    if (!isFree(g.level, body)) continue;
    g.bodies.push(body);
  }
  g.nextId = g.bodies.length;
  return g;
}

/** Storage can be missing or throw (private mode, blocked site data). */
export type Store = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function load(store: Store | null): Game | null {
  try {
    const raw = store?.getItem(SAVE_KEY);
    return raw ? restore(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function save(store: Store | null, g: Game) {
  try {
    store?.setItem(SAVE_KEY, JSON.stringify(serialize(g)));
    return true;
  } catch {
    return false;
  }
}

export function erase(store: Store | null) {
  try {
    store?.removeItem(SAVE_KEY);
  } catch {
    // Nothing to do.
  }
}

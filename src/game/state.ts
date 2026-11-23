import { CORPSE_SIZES, PLAYER_H, PLAYER_W, PROP_SIZES } from "./balance";
import { buildBlock } from "./level/block";
import type { Level, NeighbourId, PropKind } from "./level/level";
import type { Box } from "./physics";
import type { Cause, CorpsePose, CorpseTint, DeathId } from "./data/deaths";

export type Direction = "left" | "right" | "up" | "down";

export type Body = Box & {
  id: number;
  kind: PropKind | "corpse";
  vx: number;
  vy: number;
  grounded: boolean;
  held: boolean;
  /** Already bonked the player during this fall. */
  bonked: boolean;
  /** Corpses only. */
  pose?: CorpsePose;
  tint?: CorpseTint;
  attempt?: number;
  /** Carried by the crane magnet. */
  lifted?: boolean;
};

export type Player = Box & {
  vx: number;
  vy: number;
  facing: 1 | -1;
  grounded: boolean;
  coyote: number;
  climbing: boolean;
  dropTicks: number;
  /** True once the current jump can no longer be shortened. */
  jumpCut: boolean;
  holding: number | null;
  /** Highest point (smallest bottom) since last standing, for fall damage. */
  peak: number;
  lifted: "crane" | null;
  /** Recent bonks: tick and what landed. */
  bonks: { tick: number; kind: "corpse" | "prop"; speed: number }[];
  idleTicks: number;
  /** Ticks spent in the mirrors' focus and under the drip. */
  heat: number;
  damp: number;
  /** Chunk 3 interactions. */
  crumbs: boolean;
  pigeons: number;
  planted: number;
  zip: number;
};

export type Phase = "alive" | "dead" | "printing" | "twist";

export type LastDeath = {
  attempt: number;
  cause: Cause;
  id: DeathId | null;
  isNew: boolean;
  count: number;
  bonus: DeathId[];
  corpse: number | null;
  x: number;
  y: number;
};

export type GameEvent =
  | ({ type: "death" } & LastDeath)
  | { type: "respawn" }
  | { type: "carted"; attempt: number }
  | { type: "bonk" }
  | { type: "jump" }
  | { type: "land" }
  | { type: "grab" }
  | { type: "throw" }
  | { type: "tramBell" }
  | { type: "compactorWarn" }
  | { type: "compactorSlam" }
  | { type: "thud" }
  | { type: "interact"; label: string }
  | { type: "openBoard" }
  | { type: "speech"; who: NeighbourId | "you"; text: string }
  | { type: "twist"; step: number };

export const corpseSize = (pose: CorpsePose) => CORPSE_SIZES[pose];

export function newPlayer(level: Level): Player {
  return {
    x: level.spawn.x - PLAYER_W / 2,
    y: level.spawn.y - PLAYER_H,
    w: PLAYER_W,
    h: PLAYER_H,
    vx: 0,
    vy: 0,
    facing: 1,
    grounded: true,
    coyote: 0,
    climbing: false,
    dropTicks: 0,
    jumpCut: true,
    holding: null,
    peak: level.spawn.y,
    lifted: null,
    bonks: [],
    idleTicks: 0,
    heat: 0,
    damp: 0,
    crumbs: false,
    pigeons: 0,
    planted: 0,
    zip: 0,
  };
}

export function createGame(level: Level = buildBlock()) {
  const bodies: Body[] = level.props.map((p, id) => {
    const size = PROP_SIZES[p.kind];
    return {
      id,
      kind: p.kind,
      x: p.x - size.w / 2,
      y: p.y - size.h,
      ...size,
      vx: 0,
      vy: 0,
      grounded: true,
      held: false,
      bonked: false,
    };
  });
  const m = level.machines;
  return {
    level,
    ticks: 0,
    /** Every death so far, catalogued or not. */
    attempts: 0,
    phase: "alive" as Phase,
    phaseTicks: 0,
    skip: false,
    player: newPlayer(level),
    bodies,
    nextId: bodies.length,
    /** Old bodies Bas has carted away. */
    carted: 0,
    board: {} as Partial<Record<DeathId, { count: number; first: number }>>,
    last: null as LastDeath | null,
    events: [] as GameEvent[],
    input: {
      held: [] as { dir: Direction; source: string }[],
      jumpHeld: false,
      jumpBuffer: 0,
      upBuffer: 0,
      grabQueued: false,
      interactQueued: false,
    },
    tram: m.tram
      ? {
          x: m.tram.hiddenX,
          phase: "away" as "away" | "arriving" | "stopped" | "leaving",
          timer: 0,
          trips: 0,
        }
      : null,
    talks: { pell: 0, rook: 0, bas: 0, juniper: 0 } as Record<NeighbourId, number>,
    /** 0 before the twist, 1 while feedstock is low, 1.5 in the dark, 2 after it. */
    twist: 0,
    /** The attempt that made feedstock run low; the next death is the dark one. */
    twistAttempt: 0,
    /** Rebuilt from the neighbours' things: permanent and cosmetic. */
    rebuilt: false,
    /** Ticks since the rooftop party started, or 0. */
    party: 0,
    vending: m.vending
      ? { shakes: 0, phase: "up" as "up" | "tipping" | "down", timer: 0, dir: 1 as 1 | -1 }
      : null,
    crane: m.crane
      ? {
          phase: "idle" as "idle" | "lowering" | "lifting" | "moving" | "dropping" | "returning",
          timer: 0,
          x: m.crane.pickX,
          y: m.crane.liftY,
          cargo: [] as number[],
          player: false,
        }
      : null,
    /** Pell's bowls, on their way to whoever brought her a crate. */
    kindness: 0,
    compactor: m.compactor
      ? {
          plate: m.compactor.top,
          phase: "idle" as "idle" | "warning" | "slamming" | "holding" | "rising",
          timer: 0,
        }
      : null,
  };
}
export type Game = ReturnType<typeof createGame>;

export function emit(g: Game, e: GameEvent) {
  g.events.push(e);
  if (g.events.length > 200) g.events.shift();
}
/** Hands the queued events to the UI and clears them. */
export function drainEvents(g: Game) {
  return g.events.splice(0);
}

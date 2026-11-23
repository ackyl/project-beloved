import { DEATH_TICKS, JUMP_BUFFER_TICKS, SKIP_AFTER, STEP } from "./balance";
import { finishPrinting, respawn } from "./death";
import { checkHazards, updateCompactor, updateCrane, updateTram, updateVending } from "./machines";
import { controlled, updateKindness, updateStunts } from "./stunts";
import { afterDeath, updateDark, updateParty } from "./twist";
import { updatePlayer } from "./player";
import { grabOrThrow, updateBodies } from "./props";
import { interact } from "./interact";
import type { Direction, Game } from "./state";

// The simulation is authoritative and free of React and DOM. Input arrives as
// typed commands, and tick() advances one fixed 1/60 s step.
export { createGame, drainEvents } from "./state";
export type { Body, Direction, Game, GameEvent, Player } from "./state";
export { heldBody } from "./props";

export type Command =
  | { type: "move"; dir: Direction; pressed: boolean; source?: string }
  | { type: "jump"; pressed: boolean }
  | { type: "grab" }
  | { type: "interact" }
  | { type: "clear" };

const DIRECTIONS = new Set<Direction>(["left", "right", "up", "down"]);

export function command(g: Game, c: Command) {
  const input = g.input;
  switch (c.type) {
    case "clear":
      input.held.length = 0;
      input.jumpHeld = false;
      input.jumpBuffer = 0;
      input.upBuffer = 0;
      input.grabQueued = false;
      input.interactQueued = false;
      return;
    case "move": {
      if (!DIRECTIONS.has(c.dir) || typeof c.pressed !== "boolean") return;
      const source = c.source ?? c.dir;
      const newUp = c.pressed && c.dir === "up" && !input.held.some((h) => h.dir === "up");
      input.held = input.held.filter((h) => h.source !== source);
      if (c.pressed) input.held.push({ dir: c.dir, source });
      if (newUp) {
        if (g.phase === "dead") g.skip = true;
        if (g.phase === "alive") input.upBuffer = JUMP_BUFFER_TICKS;
      }
      return;
    }
    case "jump":
      if (typeof c.pressed !== "boolean") return;
      if (c.pressed && !input.jumpHeld) {
        if (g.phase === "dead") g.skip = true;
        else input.jumpBuffer = JUMP_BUFFER_TICKS;
      }
      input.jumpHeld = c.pressed;
      return;
    case "grab":
      if (g.phase === "dead") g.skip = true;
      else input.grabQueued = true;
      return;
    case "interact":
      if (g.phase === "dead") g.skip = true;
      else input.interactQueued = true;
      return;
  }
}

export function tick(g: Game) {
  g.ticks++;
  g.phaseTicks++;
  if (g.phase === "alive") {
    const busy = controlled(g);
    const fall = busy || g.phase !== "alive" ? null : updatePlayer(g);
    if (!busy && g.phase === "alive") {
      if (g.input.grabQueued) grabOrThrow(g);
      if (g.input.interactQueued) interact(g);
    }
    g.input.grabQueued = false;
    g.input.interactQueued = false;
    updateBodies(g);
    checkHazards(g, fall);
    updateStunts(g);
  } else if (g.phase === "twist") {
    g.input.grabQueued = false;
    g.input.interactQueued = false;
    updateBodies(g);
    updateDark(g);
  } else {
    g.input.grabQueued = false;
    g.input.interactQueued = false;
    updateBodies(g);
    if (g.phase === "dead" && (g.phaseTicks >= DEATH_TICKS || (g.skip && g.phaseTicks >= SKIP_AFTER)))
      respawn(g);
    else finishPrinting(g);
  }
  updateTram(g);
  updateCompactor(g);
  updateCrane(g);
  updateVending(g);
  updateKindness(g);
  updateParty(g);
  if (g.phase === "dead" && g.phaseTicks === 1) afterDeath(g);
}

export const seconds = (g: Game) => g.ticks * STEP;

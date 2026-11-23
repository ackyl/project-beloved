import { parseLevel, type Level } from "../game/level/level";
import { command, createGame, tick, type Direction, type Game } from "../game/simulation";
import { bottom, centerX, isFree } from "../game/physics";

// A 30 × 12 test room. Floor top at row 10. Feature map:
//   x 6–7    a 1-tile wall stub, 3 tall
//   x 10–13  one-way platform at row 7
//   x 17     ladder from row 4 to row 9 (top at 4), beside a ledge at row 4
//   x 18–22  ledge at row 4, and a 1-tile bump on the floor at row 9
//   x 24–28  pit: the floor drops to row 11
export const room = (props: Level["props"] = [], spawn = { x: 2.5, y: 10 }) =>
  parseLevel(
    "test room",
    [
      "##############################",
      "#............................#",
      "#............................#",
      "#............................#",
      "#................H#####......#",
      "#................H...........#",
      "#................H...........#",
      "#.....##..====...H...........#",
      "#.....##.........H...........#",
      "#.....##.........H#####......#",
      "########################.....#",
      "##############################",
    ],
    spawn,
    props,
  );

export function run(g: Game, ticks: number, each?: (g: Game) => void) {
  for (let i = 0; i < ticks; i++) {
    tick(g);
    each?.(g);
  }
}
export function press(g: Game, dir: Direction) {
  command(g, { type: "move", dir, pressed: true, source: dir });
}
export function release(g: Game, dir: Direction) {
  command(g, { type: "move", dir, pressed: false, source: dir });
}
export function jump(g: Game, holdTicks = 30) {
  command(g, { type: "jump", pressed: true });
  run(g, holdTicks);
  command(g, { type: "jump", pressed: false });
}
/** Holds a direction until the predicate passes. Fails the test after max ticks. */
export function holdUntil(g: Game, dir: Direction, done: (g: Game) => boolean, max = 1200) {
  press(g, dir);
  for (let i = 0; i < max && !done(g); i++) tick(g);
  release(g, dir);
  if (!done(g)) throw new Error(`holdUntil ${dir} timed out at x=${centerX(g.player)} y=${bottom(g.player)}`);
}
export function settle(g: Game, ticks = 90) {
  run(g, ticks);
}
/** Every box in the game stays out of solid tiles. */
export function assertNoOverlap(g: Game) {
  if (!isFree(g.level, g.player)) throw new Error(`player inside a tile at tick ${g.ticks}`);
  for (const b of g.bodies)
    if (!b.held && !isFree(g.level, b))
      throw new Error(`${b.kind} ${b.id} inside a tile at tick ${g.ticks}`);
}
export const fresh = (props: Level["props"] = [], spawn?: { x: number; y: number }) =>
  createGame(room(props, spawn));

/** Seeded command fuzzer. Same seed, same commands. */
export function fuzz(g: Game, seed: number, ticks: number, each?: (g: Game) => void) {
  let s = seed >>> 0;
  const rand = () => ((s = (Math.imul(1664525, s) + 1013904223) >>> 0) / 4294967296);
  const dirs: Direction[] = ["left", "right", "up", "down"];
  for (let i = 0; i < ticks; i++) {
    const r = rand();
    if (r < 0.06) command(g, { type: "move", dir: dirs[Math.floor(rand() * 4)], pressed: rand() < 0.6 });
    else if (r < 0.09) command(g, { type: "jump", pressed: rand() < 0.5 });
    else if (r < 0.11) command(g, { type: "grab" });
    else if (r < 0.112) command(g, { type: "clear" });
    tick(g);
    each?.(g);
  }
}

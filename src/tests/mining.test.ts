import { STRIKE_TICKS } from "../game/balance";
import { expect, test } from "vitest";
import { command, createGame, tick } from "../game/simulation";
import { at, hardness, tile } from "../game/world";
test.each(["earth", "stone", "crystal"] as const)(
  "held contact mines %s on a fixed cadence",
  (kind) => {
    const g = createGame();
    g.x = 17.77;
    g.y = 10.5;
    g.world.cells[10 * g.world.w + 18] = tile(kind);
    command(g, { type: "move", dir: "right", pressed: true });
    tick(g);
    expect(g.x).toBe(17.77);
    for (let i = 1; i < hardness[kind]; i++) {
      for (let j = 1; j < STRIKE_TICKS; j++) tick(g);
      expect(at(g.world, 18, 10).hp).toBe(hardness[kind] - i);
      tick(g);
    }
    expect(at(g.world, 18, 10).kind).toBe("empty");
    tick(g);
    expect(g.x).toBeGreaterThan(17.77);
  },
);
test("float stays still without intent, newest direction wins, clear stops movement", () => {
  const g = createGame(),
    start = g.y;
  command(g, { type: "move", dir: "left", pressed: true });
  command(g, { type: "move", dir: "up", pressed: true });
  tick(g);
  expect(g.y).toBeLessThan(start);
  expect(g.x).toBe(17.5);
  command(g, { type: "clear" });
  const y = g.y;
  tick(g);
  expect(g.y).toBe(y);
});
test("protected walls resist continuous contact", () => {
  const g = createGame();
  g.x = 12.5;
  g.y = 11.76;
  command(g, { type: "move", dir: "down", pressed: true });
  for (let i = 0; i < 180; i++) tick(g);
  expect(at(g.world, 12, 12).kind).toBe("shell");
  expect(g.y).toBeLessThan(12);
});
test("invalid commands and malformed direction flags are ignored", () => {
  const g = createGame();
  command(g, { type: "move", dir: "northeast", pressed: true } as never);
  command(g, { type: "move", dir: "right", pressed: "yes" } as never);
  command(g, { type: "deduce", id: "unknown" } as never);
  command(g, { type: "invalid" } as never);
  expect(g).toEqual(createGame());
});
test("keyboard aliases and fingers release only their own movement intent", () => {
  const g = createGame();
  for (const source of ["KeyW", "ArrowUp", "touch-1"])
    command(g, { type: "move", dir: "up", pressed: true, source });
  command(g, { type: "move", dir: "up", pressed: false, source: "ArrowUp" });
  command(g, { type: "move", dir: "up", pressed: false, source: "KeyW" });
  const y = g.y;
  tick(g);
  expect(g.y).toBeLessThan(y);
  command(g, { type: "move", dir: "up", pressed: false, source: "touch-1" });
  const stop = g.y;
  tick(g);
  expect(g.y).toBe(stop);
});

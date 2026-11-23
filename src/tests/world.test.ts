import { test, expect } from "vitest";
import { createGame, command, tick } from "../game/simulation";
import { at, generate } from "../game/world";

test("seeded world repeats exactly, other seeds vary", () => {
  expect(generate(10)).toEqual(generate(10));
  expect(generate(10)).not.toEqual(generate(11));
});
test("mineable paths connect home, bloom, both resources and annex approach on 80 seeds", () => {
  for (let seed = 0; seed < 80; seed++) {
    const w = generate(seed),
      start = 11 * w.w + 17,
      seen = new Set([start]),
      queue = [start];
    for (let i = 0; i < queue.length; i++) {
      for (const n of [
        queue[i] - 1,
        queue[i] + 1,
        queue[i] - w.w,
        queue[i] + w.w,
      ])
        if (!seen.has(n) && w.cells[n]?.kind !== "shell") {
          seen.add(n);
          queue.push(n);
        }
    }
    for (const [x, y] of [
      [w.bloom.x, w.bloom.y],
      [w.annex.x - 1, w.annex.y],
      [18, 12],
      [19, 14],
    ])
      expect(seen.has(Math.floor(y) * w.w + Math.floor(x))).toBe(true);
    expect(at(w, 18, 12).kind).toBe("copper");
    expect(at(w, 19, 14).kind).toBe("crystal");
  }
});
test("minerals persist at capacity and sample pocket remains available", () => {
  const g = createGame();
  Object.assign(g, g.world.bloom);
  g.bag.copper = 7;
  g.world.drops.push({ x: g.x, y: g.y, item: "crystal" });
  tick(g);
  expect(g.bag.bloom).toBe(1);
  expect(g.world.drops).toHaveLength(1);
  g.bag.copper--;
  tick(g);
  expect(g.bag.crystal).toBe(1);
});
test("panel needs uninterrupted local hold and stays open", () => {
  const g = createGame(),
    a = g.world.annex;
  command(g, { type: "hold", active: true });
  tick(g);
  expect(g.holdTicks).toBe(0);
  g.x = a.x - 0.5;
  g.y = a.y + 0.5;
  command(g, { type: "hold", active: true });
  for (let i = 0; i < 40; i++) tick(g);
  expect(g.panelOpen).toBe(false);
  command(g, { type: "clear" });
  expect(g.holdTicks).toBe(0);
  command(g, { type: "hold", active: true });
  for (let i = 0; i < 42; i++) tick(g);
  expect(g.panelOpen).toBe(true);
  expect(at(g.world, a.x, a.y).kind).toBe("empty");
});
test("identical ordered commands reproduce excavation and inventory", () => {
  const run = () => {
    const g = createGame(42);
    for (const dir of ["down", "right", "left", "up"] as const) {
      command(g, { type: "move", dir, pressed: true });
      for (let i = 0; i < 75; i++) tick(g);
      command(g, { type: "clear" });
    }
    return g;
  };
  expect(run()).toEqual(run());
  expect(createGame(NaN).seed).toBe(1703);
});

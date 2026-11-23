import { expect, test } from "vitest";
import {
  createGame,
  command,
  tick,
  type Game,
  type Direction,
} from "../game/simulation";
function travel(g: Game, axis: "x" | "y", goal: number) {
  const sign = Math.sign(goal - g[axis]);
  const dir: Direction =
    axis === "x" ? (sign > 0 ? "right" : "left") : sign > 0 ? "down" : "up";
  command(g, { type: "move", dir, pressed: true });
  for (let i = 0; i < 2200 && (goal - g[axis]) * sign > 0.035; i++) tick(g);
  command(g, { type: "move", dir, pressed: false });
  expect(Math.abs(goal - g[axis])).toBeLessThan(0.1);
}
test.each([0, 1703, 4294967295])(
  "complete excavation, annex and care loop, seed %d",
  (seed) => {
    const g = createGame(seed),
      a = g.world.annex,
      b = g.world.bloom;
    travel(g, "y", 12.5);
    travel(g, "x", 18.5);
    expect(g.bag.copper).toBeGreaterThan(0);
    travel(g, "x", 19.5);
    travel(g, "y", 14.5);
    expect(g.bag.crystal).toBeGreaterThan(0);
    travel(g, "x", b.x);
    travel(g, "y", b.y);
    expect(g.bag.bloom).toBe(1);
    travel(g, "x", a.x - 0.5);
    travel(g, "y", a.y + 0.5);
    command(g, { type: "hold", active: true });
    for (let i = 0; i < 42; i++) tick(g);
    expect(g.panelOpen).toBe(true);
    travel(g, "y", 11.45);
    travel(g, "x", 17.5);
    command(g, { type: "test", id: "resonance" });
    command(g, { type: "test", id: "repair" });
    command(g, { type: "deduce", id: "support" });
    command(g, { type: "craft" });
    command(g, { type: "care" });
    expect(g.revealed).toBe(true);
    expect(g.feedback).toContain("Three breaths");
    expect(g.prepared).toBe(false);
    const fresh = createGame(seed);
    expect(fresh.revealed).toBe(false);
    expect(fresh.bag.bloom).toBe(0);
  },
);

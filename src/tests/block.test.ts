import { describe, expect, it } from "vitest";
import { buildBlock, STREET } from "../game/level/block";
import { createGame } from "../game/simulation";
import { bottom, centerX, isFree } from "../game/physics";
import { assertNoOverlap, fuzz, holdUntil, jump, press, release, run, settle } from "./helpers";

const near = (a: number, b: number) => Math.abs(a - b) < 1e-3;

describe("the block", () => {
  it("has equal-length rows and the documented size", () => {
    const l = buildBlock();
    expect(l.rows).toHaveLength(l.h);
    expect(l.rows.every((r) => r.length === l.w)).toBe(true);
    expect([l.w, l.h]).toEqual([112, 33]);
  });

  it("spawns the player and every prop in open space, resting on something", () => {
    const g = createGame();
    settle(g, 120);
    expect(bottom(g.player)).toBeCloseTo(STREET, 5);
    assertNoOverlap(g);
    for (const b of g.bodies) {
      expect(isFree(g.level, b)).toBe(true);
      expect(b.grounded).toBe(true);
    }
  });

  it("can be climbed from the flat to the top of the antenna", () => {
    const g = createGame();
    settle(g, 10);
    // Flat to floor 2.
    holdUntil(g, "right", (g) => centerX(g.player) >= 41.3);
    run(g, 20);
    holdUntil(g, "up", (g) => g.player.grounded && near(bottom(g.player), 24));
    // Floor 2 to the roof.
    holdUntil(g, "left", (g) => centerX(g.player) <= 25.7);
    run(g, 20);
    holdUntil(g, "up", (g) => g.player.grounded && near(bottom(g.player), 18));
    // Over the water tank to the antenna.
    holdUntil(g, "right", (g) => centerX(g.player) >= 36.5);
    press(g, "right");
    jump(g, 40);
    for (let i = 0; i < 200 && centerX(g.player) < 43.2; i++) run(g, 1);
    release(g, "right");
    run(g, 60);
    expect(Math.floor(centerX(g.player))).toBe(43);
    holdUntil(g, "up", (g) => g.player.grounded && near(bottom(g.player), 8));
  });

  it("stays consistent under random input across the whole block", () => {
    for (const seed of [5, 1703]) fuzz(createGame(), seed, 6000, assertNoOverlap);
  });
});

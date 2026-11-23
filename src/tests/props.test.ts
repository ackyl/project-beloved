import { describe, expect, it } from "vitest";
import { command, heldBody } from "../game/simulation";
import { parseLevel } from "../game/level/level";
import { createGame } from "../game/simulation";
import { bottom, centerX, isFree } from "../game/physics";
import { assertNoOverlap, fresh, fuzz, holdUntil, jump, press, release, run, settle } from "./helpers";

const grab = (g: ReturnType<typeof fresh>) => {
  command(g, { type: "grab" });
  run(g, 1);
};

describe("grabbing and carrying", () => {
  it("picks up the prop in front and carries it above the head", () => {
    const g = fresh([{ kind: "crate", x: 3.5, y: 10 }]);
    settle(g, 5);
    grab(g);
    const crate = heldBody(g)!;
    expect(crate.kind).toBe("crate");
    holdUntil(g, "left", (g) => centerX(g.player) <= 2);
    expect(centerX(crate)).toBeCloseTo(centerX(g.player), 5);
    expect(bottom(crate)).toBeLessThan(g.player.y + 0.1);
  });

  it("does nothing when nothing is in reach", () => {
    const g = fresh([{ kind: "crate", x: 12, y: 10 }]);
    grab(g);
    expect(g.player.holding).toBeNull();
  });

  it("grabs the nearest of two props", () => {
    const g = fresh([
      { kind: "pot", x: 3.8, y: 10 },
      { kind: "crate", x: 3.3, y: 10 },
    ]);
    settle(g, 5);
    grab(g);
    expect(heldBody(g)!.kind).toBe("crate");
  });
});

describe("throwing and setting down", () => {
  const throwRun = () => {
    const g = fresh([{ kind: "crate", x: 3.4, y: 10 }], { x: 2.5, y: 10 });
    settle(g, 5);
    grab(g);
    grab(g);
    settle(g, 120);
    return g;
  };

  it("throws forward in a deterministic arc and lands on the floor", () => {
    const a = throwRun(),
      b = throwRun();
    expect(a.bodies[0].x).toBe(b.bodies[0].x);
    expect(a.bodies[0].y).toBe(b.bodies[0].y);
    expect(centerX(a.bodies[0])).toBeGreaterThan(3.5);
    expect(a.bodies[0].grounded).toBe(true);
    assertNoOverlap(a);
  });

  it("throws upward when up is held, landing near the player", () => {
    const g = fresh([{ kind: "pot", x: 4, y: 10 }], { x: 3.5, y: 10 });
    settle(g, 5);
    grab(g);
    const carried = g.bodies[0].y;
    press(g, "up");
    grab(g);
    release(g, "up");
    let top = Infinity;
    run(g, 120, (g) => (top = Math.min(top, g.bodies[0].y)));
    expect(top).toBeLessThan(carried - 1.5);
    expect(Math.abs(centerX(g.bodies[0]) - 3.5)).toBeLessThan(2);
    expect(g.bodies[0].grounded).toBe(true);
  });

  it("sets a prop down at the feet when down is held", () => {
    const g = fresh([{ kind: "crate", x: 12.5, y: 10 }], { x: 12, y: 10 });
    settle(g, 5);
    grab(g);
    press(g, "down");
    grab(g);
    release(g, "down");
    const crate = g.bodies[0];
    expect(bottom(crate)).toBeCloseTo(bottom(g.player), 5);
    expect(crate.x).toBeGreaterThan(g.player.x + g.player.w);
  });

  it("never sets a prop down inside a wall", () => {
    const g = fresh([{ kind: "crate", x: 4.5, y: 10 }]);
    settle(g, 5);
    grab(g);
    press(g, "right");
    run(g, 60);
    release(g, "right");
    press(g, "down");
    grab(g);
    release(g, "down");
    assertNoOverlap(g);
    settle(g, 60);
    assertNoOverlap(g);
  });

  it("never throws a prop into the ceiling during a jump in a low corridor", () => {
    const low = createGame(
      parseLevel(
        "low",
        ["##########", "##########", "#........#", "#........#", "#........#", "##########"],
        { x: 4, y: 5 },
        [{ kind: "crate", x: 4.8, y: 5 }],
      ),
    );
    settle(low, 5);
    command(low, { type: "grab" });
    run(low, 1);
    command(low, { type: "jump", pressed: true });
    run(low, 6);
    command(low, { type: "grab" });
    run(low, 1, assertNoOverlap);
    run(low, 120, assertNoOverlap);
  });
});

describe("standing and stacking", () => {
  it("stacks a falling prop on top of another", () => {
    const g = fresh([
      { kind: "crate", x: 15, y: 10 },
      { kind: "crate", x: 15.1, y: 6 },
    ]);
    settle(g, 120);
    const [low, high] = g.bodies;
    expect(bottom(high)).toBeCloseTo(low.y, 5);
    expect(high.grounded).toBe(true);
  });

  it("lets the player stand on a crate", () => {
    const g = fresh([{ kind: "crate", x: 4.6, y: 10 }]);
    settle(g, 5);
    holdUntil(g, "right", (g) => centerX(g.player) >= 3.9);
    jump(g, 30);
    press(g, "right");
    run(g, 6);
    release(g, "right");
    run(g, 90);
    expect(bottom(g.player)).toBeCloseTo(g.bodies[0].y, 5);
    expect(g.player.grounded).toBe(true);
  });

  it("drops what was on top when the bottom prop is carried away", () => {
    const g = fresh([
      { kind: "crate", x: 3.5, y: 10 },
      { kind: "pot", x: 3.5, y: 9.3 },
    ]);
    settle(g, 30);
    grab(g);
    holdUntil(g, "left", (g) => centerX(g.player) <= 1.8);
    settle(g, 90);
    const pot = g.bodies.find((b) => b.kind === "pot")!;
    expect(bottom(pot)).toBeCloseTo(10, 5);
  });
});

describe("props under random input", () => {
  it("no prop ever ends up inside a tile", () => {
    for (const seed of [7, 99, 2024])
      fuzz(
        fresh([
          { kind: "crate", x: 4, y: 10 },
          { kind: "pot", x: 9, y: 10 },
          { kind: "tire", x: 15, y: 10 },
        ]),
        seed,
        5000,
        (g) => {
          assertNoOverlap(g);
          for (const b of g.bodies) if (!isFree(g.level, b) && !b.held) throw new Error("overlap");
        },
      );
  });
});

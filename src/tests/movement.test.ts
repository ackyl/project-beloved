import { describe, expect, it } from "vitest";
import { command, createGame } from "../game/simulation";
import { parseLevel } from "../game/level/level";
import { bottom, centerX, moveX, moveY } from "../game/physics";
import { JUMP_BUFFER_TICKS, MAX_FALL, MAX_HORIZONTAL, STEP } from "../game/balance";
import { assertNoOverlap, fresh, fuzz, holdUntil, jump, press, release, run, settle } from "./helpers";

const ledge = (spawnX = 3.5) =>
  createGame(
    parseLevel(
      "ledge",
      [
        "####################",
        "#..................#",
        "#..................#",
        "#..................#",
        "#..................#",
        "#..................#",
        "##########.........#",
        "##########.........#",
        "##########.........#",
        "####################",
      ],
      { x: spawnX, y: 6 },
    ),
  );

describe("walking", () => {
  it("starts standing on the floor", () => {
    const g = fresh();
    settle(g, 5);
    expect(bottom(g.player)).toBeCloseTo(10, 5);
    expect(g.player.grounded).toBe(true);
  });

  it("lets the most recently pressed direction win, and resumes the other on release", () => {
    const g = fresh([], { x: 12, y: 10 });
    command(g, { type: "move", dir: "right", pressed: true, source: "KeyD" });
    run(g, 20);
    command(g, { type: "move", dir: "left", pressed: true, source: "ArrowLeft" });
    run(g, 20);
    expect(g.player.vx).toBeLessThan(0);
    expect(g.player.facing).toBe(-1);
    command(g, { type: "move", dir: "left", pressed: false, source: "ArrowLeft" });
    run(g, 20);
    expect(g.player.vx).toBeGreaterThan(0);
    expect(g.player.facing).toBe(1);
  });

  it("stops flush against a wall", () => {
    const g = fresh();
    press(g, "right");
    run(g, 120);
    expect(g.player.x + g.player.w).toBeCloseTo(6, 5);
    expect(g.player.vx).toBe(0);
  });

  it("stops when every input is cleared", () => {
    const g = fresh([], { x: 12, y: 10 });
    press(g, "right");
    run(g, 30);
    command(g, { type: "clear" });
    run(g, 30);
    expect(g.player.vx).toBe(0);
  });
});

describe("jumping", () => {
  const apex = (holdTicks: number) => {
    const g = fresh();
    let top = Infinity;
    command(g, { type: "jump", pressed: true });
    run(g, holdTicks, (g) => (top = Math.min(top, bottom(g.player))));
    command(g, { type: "jump", pressed: false });
    run(g, 90, (g) => (top = Math.min(top, bottom(g.player))));
    return { g, height: 10 - top };
  };

  it("a held jump clears 3-tile ledges and lands back on the floor", () => {
    const { g, height } = apex(60);
    expect(height).toBeGreaterThan(3.3);
    expect(height).toBeLessThan(4);
    expect(bottom(g.player)).toBeCloseTo(10, 5);
    expect(g.player.grounded).toBe(true);
  });

  it("releasing early gives a short hop", () => {
    expect(apex(3).height).toBeLessThan(2);
  });

  it("jumps over the 3-tile wall stub", () => {
    const g = fresh();
    holdUntil(g, "right", (g) => centerX(g.player) >= 4.6);
    press(g, "right");
    jump(g, 40);
    run(g, 40, assertNoOverlap);
    release(g, "right");
    expect(centerX(g.player)).toBeGreaterThan(8);
  });

  it("allows a jump for a few ticks after walking off a ledge (coyote time)", () => {
    const g = ledge();
    holdUntil(g, "right", (g) => !g.player.grounded);
    run(g, 3);
    command(g, { type: "jump", pressed: true });
    run(g, 2);
    expect(g.player.vy).toBeLessThan(0);
  });

  it("refuses a late jump after the coyote window", () => {
    const g = ledge();
    holdUntil(g, "right", (g) => !g.player.grounded);
    run(g, 10);
    command(g, { type: "jump", pressed: true });
    run(g, 2);
    expect(g.player.vy).toBeGreaterThan(0);
  });

  it("buffers a jump pressed just before landing", () => {
    const g = fresh();
    jump(g, 60);
    for (let i = 0; i < 120 && !(g.player.vy > 0 && bottom(g.player) > 9.4); i++) run(g, 1);
    command(g, { type: "jump", pressed: true });
    let rejumped = false;
    run(g, JUMP_BUFFER_TICKS + 6, (g) => (rejumped ||= g.player.vy < 0));
    expect(rejumped).toBe(true);
  });

  it("forgets a jump pressed long before landing", () => {
    const g = fresh();
    command(g, { type: "jump", pressed: true });
    run(g, 12);
    command(g, { type: "jump", pressed: false });
    command(g, { type: "jump", pressed: true });
    command(g, { type: "jump", pressed: false });
    run(g, 120);
    expect(g.player.grounded).toBe(true);
    expect(bottom(g.player)).toBeCloseTo(10, 5);
  });
});

describe("one-way platforms", () => {
  it("jumps up through a platform, stands on it, and drops through with down", () => {
    const g = fresh([], { x: 11.5, y: 10 });
    jump(g, 60);
    run(g, 60);
    expect(bottom(g.player)).toBeCloseTo(7, 5);
    expect(g.player.grounded).toBe(true);
    press(g, "down");
    run(g, 60);
    release(g, "down");
    expect(bottom(g.player)).toBeCloseTo(10, 5);
  });
});

describe("ladders", () => {
  it("climbs up to the ledge, walks off, and climbs back down", () => {
    const g = fresh([], { x: 15.5, y: 10 });
    holdUntil(g, "right", (g) => centerX(g.player) >= 17.2);
    run(g, 20);
    holdUntil(g, "up", (g) => g.player.grounded && Math.abs(bottom(g.player) - 4) < 1e-3);
    holdUntil(g, "right", (g) => centerX(g.player) >= 20);
    run(g, 30);
    expect(bottom(g.player)).toBeCloseTo(4, 5);
    holdUntil(g, "left", (g) => centerX(g.player) <= 17.8);
    run(g, 30);
    holdUntil(g, "down", (g) => g.player.grounded && Math.abs(bottom(g.player) - 10) < 1e-3);
  });

  it("jumps off a ladder", () => {
    const g = fresh([], { x: 17.5, y: 10 });
    press(g, "up");
    run(g, 20);
    release(g, "up");
    expect(g.player.climbing).toBe(true);
    command(g, { type: "jump", pressed: true });
    run(g, 2);
    expect(g.player.climbing).toBe(false);
    expect(g.player.vy).toBeLessThan(0);
  });
});

describe("no tunnelling", () => {
  const thin = parseLevel(
    "thin",
    ["..........", "..........", "....#.....", "####.#####", "..........", ".........."],
    { x: 1, y: 3 },
  );

  it("a box falling at maximum speed lands on a 1-tile floor", () => {
    const b = { x: 0.2, y: -40, w: 0.7, h: 1.15 };
    let landed = null;
    for (let i = 0; i < 400 && !landed; i++) landed = moveY(thin, b, MAX_FALL * STEP);
    expect(landed).toBe("floor");
    expect(b.y + b.h).toBeCloseTo(3, 5);
  });

  it("a box moving at maximum speed stops at a 1-tile wall", () => {
    const b = { x: 0.2, y: 1.85, w: 0.7, h: 1.15 };
    let hit = false;
    for (let i = 0; i < 200 && !hit; i++) hit = moveX(thin, b, MAX_HORIZONTAL * STEP);
    expect(hit).toBe(true);
    expect(b.x + b.w).toBeCloseTo(4, 5);
  });
});

describe("determinism and invariants", () => {
  it("the same commands give the same state", () => {
    const a = fresh([{ kind: "crate", x: 4, y: 10 }]),
      b = fresh([{ kind: "crate", x: 4, y: 10 }]);
    fuzz(a, 42, 3000);
    fuzz(b, 42, 3000);
    expect(a.player).toEqual(b.player);
    expect(a.bodies).toEqual(b.bodies);
  });

  it("the player never ends up inside a tile under random input", () => {
    for (const seed of [1, 2, 3, 1703]) fuzz(fresh(), seed, 4000, assertNoOverlap);
  });
});

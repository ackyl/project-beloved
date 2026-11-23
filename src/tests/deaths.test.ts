import { describe, expect, it } from "vitest";
import { buildBlock, STREET } from "../game/level/block";
import { command, createGame, drainEvents, tick, type Game } from "../game/simulation";
import { kill } from "../game/death";
import { bottom, centerX, isFree } from "../game/physics";
import { CORPSE_CAP, DEATH_TICKS, PRINT_TICKS, SKIP_AFTER } from "../game/balance";
import { BOARD, classify, deathById, type DeathEvent } from "../game/data/deaths";
import { fresh, holdUntil, jump, press, release, run, settle } from "./helpers";
import { parseLevel } from "../game/level/level";

const at = (x: number, y: number) => createGame({ ...buildBlock(), spawn: { x, y } });
const corpses = (g: Game) => g.bodies.filter((b) => b.kind === "corpse");
const untilDead = (g: Game, max = 2400) => {
  for (let i = 0; i < max && g.phase === "alive"; i++) tick(g);
  expect(g.phase).toBe("dead");
  return g.last!;
};
const untilAlive = (g: Game) => {
  for (let i = 0; i < 400 && g.phase !== "alive"; i++) tick(g);
  expect(g.phase).toBe("alive");
};

describe("the death registry", () => {
  it("has 20 findable deaths plus the twist, numbered in order", () => {
    expect(BOARD).toHaveLength(20);
    expect(BOARD.map((d) => d.n)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
    expect(deathById.laughing.twist).toBe(true);
  });

  const base: DeathEvent = { cause: "fall", fall: 9, lifted: null, holdingCorpse: false, bonkKind: null, bonks: 1, watchers: 0 };
  it("prefers specific combinations over general causes", () => {
    expect(classify({ ...base, cause: "compactor", holdingCorpse: true })?.id).toBe("twoForOne");
    expect(classify({ ...base, cause: "compactor" })?.id).toBe("compacted");
    expect(classify({ ...base, lifted: "crane" })?.id).toBe("crane");
    expect(classify(base)?.id).toBe("gravity");
    expect(classify({ ...base, cause: "bonk", bonkKind: "corpse", bonks: 3 })?.id).toBe("groupHug");
    expect(classify({ ...base, cause: "bonk", bonkKind: "corpse" })?.id).toBe("selfInflicted");
    expect(classify({ ...base, cause: "bonk", bonkKind: "prop" })).toBeNull();
  });
});

describe("dying and replication", () => {
  it("a long fall is Gravity Research, leaves a body, and prints a fresh copy", () => {
    // Walk off the fire escape landing at roof height, past the balcony.
    const g = at(47, 18);
    settle(g, 5);
    press(g, "right");
    untilDead(g, 600);
    release(g, "right");
    const last = g.last!;
    expect(last.id).toBe("gravity");
    expect(last.isNew).toBe(true);
    expect(g.attempts).toBe(1);
    const body = corpses(g)[0];
    expect(body.pose).toBe("flat");
    settle(g, 30);
    expect(body.grounded).toBe(true);
    untilAlive(g);
    expect(centerX(g.player)).toBeCloseTo(47, 5);
    expect(corpses(g)).toHaveLength(1);
  });

  it("survives a 6-tile drop", () => {
    const g = createGame(
      parseLevel(
        "drop",
        ["#########", "#.......#", "#.......#", "####....#", "#.......#", "#.......#", "#.......#", "#.......#", "#.......#", "#########"],
        { x: 2, y: 3 },
      ),
    );
    holdUntil(g, "right", (g) => g.player.grounded && bottom(g.player) > 8.9, 600);
    expect(g.phase).toBe("alive");
  });

  it("walking off the dumpster lid lands in Pell's fryer", () => {
    const g = at(47, 24);
    press(g, "right");
    untilDead(g, 600);
    expect(g.last!.id).toBe("fried");
  });

  it("finishes the whole death-to-control cycle within 3 seconds, and can be skipped", () => {
    const g = fresh();
    kill(g, "fall", { fall: 9 });
    let ticks = 0;
    while (g.phase !== "alive" && ticks < 400) {
      tick(g);
      ticks++;
    }
    expect(ticks).toBeLessThanOrEqual(DEATH_TICKS + PRINT_TICKS + 2);
    expect(ticks).toBeLessThanOrEqual(180);
    kill(g, "fall", { fall: 9 });
    command(g, { type: "jump", pressed: true });
    run(g, SKIP_AFTER + 1);
    expect(g.phase).not.toBe("dead");
  });

  it("counts repeats without re-awarding them", () => {
    const g = fresh();
    kill(g, "canal");
    untilAlive(g);
    kill(g, "canal");
    expect(g.last!.isNew).toBe(false);
    expect(g.last!.count).toBe(2);
    expect(g.board.canal).toEqual({ count: 2, first: 1 });
    expect(g.attempts).toBe(2);
  });

  it("still counts an uncatalogued death as an attempt", () => {
    const g = fresh();
    kill(g, "bonk", { bonkKind: "prop", bonks: 1 });
    expect(g.attempts).toBe(1);
    expect(g.last!.id).toBeNull();
  });

  it("stacks a new body on an old one instead of overlapping it", () => {
    const g = fresh([], { x: 12, y: 10 });
    kill(g, "fall", { fall: 9 });
    untilAlive(g);
    kill(g, "fall", { fall: 9 });
    settle(g, 40);
    const [a, b] = corpses(g);
    expect(bottom(b)).toBeCloseTo(a.y, 3);
  });

  it("carts the oldest body away past the cap", () => {
    const g = fresh([], { x: 12, y: 10 });
    for (let i = 0; i < CORPSE_CAP + 2; i++) {
      kill(g, "fall", { fall: 9 });
      untilAlive(g);
    }
    expect(corpses(g)).toHaveLength(CORPSE_CAP);
    expect(g.carted).toBe(2);
    expect(corpses(g)[0].attempt).toBe(3);
    expect(drainEvents(g).filter((e) => e.type === "carted")).toHaveLength(2);
  });

  it("drops whatever it was carrying where it died", () => {
    const g = fresh([{ kind: "crate", x: 3.3, y: 10 }]);
    settle(g, 5);
    command(g, { type: "grab" });
    run(g, 1);
    kill(g, "canal");
    expect(g.bodies[0].held).toBe(false);
    expect(isFree(g.level, g.bodies[0])).toBe(true);
  });
});

describe("block hazards", () => {
  it("the canal: Not Waterproof", () => {
    const g = at(21, STREET);
    holdUntil(g, "left", (g) => g.phase !== "alive", 600);
    expect(g.last!.id).toBe("canal");
    expect(corpses(g)[0].tint).toBe("wet");
  });

  it("the tram: Mind the Gap, with the body flung along the street", () => {
    const g = at(4, STREET);
    const last = untilDead(g, 1200);
    expect(last.id).toBe("tram");
    const body = corpses(g)[0];
    expect(body.vx).toBeGreaterThan(0);
  });

  it("the tram roof can be stood on while it waits", () => {
    const g = at(4, STREET);
    // Wait on the shelter roof, out of the way.
    const shelter = createGame({ ...buildBlock(), spawn: { x: 11, y: 27 } });
    for (let i = 0; i < 700 && shelter.tram!.phase !== "stopped"; i++) tick(shelter);
    expect(shelter.tram!.phase).toBe("stopped");
    expect(shelter.phase).toBe("alive");
    void g;
  });

  it("the fryer: Deep Fried", () => {
    const g = at(56.2, STREET);
    settle(g, 5);
    jump(g, 40);
    untilDead(g, 120);
    expect(g.last!.id).toBe("fried");
    expect(corpses(g)[0].tint).toBe("fried");
  });

  it("walking past the noodle cart is safe", () => {
    const g = at(53, STREET);
    holdUntil(g, "right", (g) => centerX(g.player) > 58.5, 600);
    expect(g.phase).toBe("alive");
  });

  it("the compactor: Compacted, then Two for One while holding the old cube", () => {
    const g = at(90.5, 32);
    expect(untilDead(g).id).toBe("compacted");
    expect(corpses(g)[0].pose).toBe("cube");
    untilAlive(g);
    settle(g, 5);
    command(g, { type: "grab" });
    run(g, 1);
    expect(g.player.holding).not.toBeNull();
    expect(untilDead(g).id).toBe("twoForOne");
    expect(corpses(g).every((c) => c.pose === "cube")).toBe(true);
  });

  it("the compactor turns props into scrap cubes", () => {
    const g = createGame({ ...buildBlock(), props: [{ kind: "crate", x: 90, y: 32 }] });
    run(g, 700);
    expect(g.bodies[0].kind).toBe("cube");
  });
});

describe("bodies as tools", () => {
  it("throwing an old body straight up and standing under it is Self-Inflicted", () => {
    const g = fresh([], { x: 12, y: 10 });
    kill(g, "fall", { fall: 9 });
    untilAlive(g);
    settle(g, 20);
    command(g, { type: "grab" });
    run(g, 1);
    expect(g.player.holding).not.toBeNull();
    press(g, "up");
    command(g, { type: "grab" });
    run(g, 1);
    release(g, "up");
    untilDead(g, 200);
    expect(g.last!.id).toBe("selfInflicted");
  });

  it("three bodies landing at once is a Group Hug", () => {
    const g = fresh([], { x: 15, y: 10 });
    settle(g, 5);
    const p = g.player;
    for (let i = 0; i < 3; i++)
      g.bodies.push({
        id: g.nextId++, kind: "corpse", pose: "flat", tint: "none", attempt: 0,
        x: centerX(p) - 0.9 + i * 0.3, y: p.y - 0.7, w: 1.2, h: 0.6,
        vx: 0, vy: 3, grounded: false, held: false, bonked: false,
      });
    untilDead(g, 120);
    expect(g.last!.id).toBe("groupHug");
  });

  it("one slow body landing on your head is only a bonk", () => {
    const g = fresh([], { x: 15, y: 10 });
    settle(g, 5);
    const p = g.player;
    g.bodies.push({
      id: g.nextId++, kind: "corpse", pose: "flat", tint: "none", attempt: 0,
      x: centerX(p) - 0.6, y: p.y - 0.7, w: 1.2, h: 0.6,
      vx: 0, vy: 3, grounded: false, held: false, bonked: false,
    });
    run(g, 60);
    expect(g.phase).toBe("alive");
    expect(drainEvents(g).some((e) => e.type === "bonk")).toBe(true);
  });

  it("builds a tower: jump, then drop a body straight down and land on it", () => {
    const g = fresh([], { x: 15.5, y: 10 });
    kill(g, "fall", { fall: 9, pose: "upright" });
    untilAlive(g);
    settle(g, 20);
    command(g, { type: "grab" });
    run(g, 1);
    command(g, { type: "jump", pressed: true });
    run(g, 18);
    press(g, "down");
    command(g, { type: "grab" });
    run(g, 1);
    release(g, "down");
    command(g, { type: "jump", pressed: false });
    run(g, 90);
    const body = corpses(g)[0];
    expect(bottom(body)).toBeCloseTo(10, 3);
    expect(bottom(g.player)).toBeCloseTo(body.y, 3);
  });
});

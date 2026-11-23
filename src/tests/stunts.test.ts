import { describe, expect, it } from "vitest";
import { buildBlock, STREET } from "../game/level/block";
import { command, createGame, drainEvents, tick, type Game } from "../game/simulation";
import { kill } from "../game/death";
import { prompt } from "../game/interact";
import { bottom, centerX } from "../game/physics";
import { BORED_TICKS } from "../game/balance";
import { holdUntil, jump, press, release, run, settle } from "./helpers";

const at = (x: number, y: number, props = buildBlock().props) =>
  createGame({ ...buildBlock(), spawn: { x, y }, props });
const use = (g: Game) => {
  command(g, { type: "interact" });
  tick(g);
};
const untilDead = (g: Game, max = 2400) => {
  for (let i = 0; i < max && g.phase === "alive"; i++) tick(g);
  expect(g.phase).toBe("dead");
  return g.last!;
};

describe("interactions", () => {
  it("shows a prompt for the nearest thing", () => {
    expect(prompt(at(47.3, STREET))).toBe("Plug yourself in");
    expect(prompt(at(57.6, STREET))).toBe("Talk to Auntie Pell");
    expect(prompt(at(30, STREET))).toBeNull();
  });

  it("plugging into the power strip is Overclocked", () => {
    const g = at(47.3, STREET);
    use(g);
    expect(g.last!.id).toBe("overclocked");
  });

  it("shaking the vending machine four times tips it onto you", () => {
    const g = at(61.2, STREET);
    settle(g, 5);
    for (let i = 0; i < 4; i++) use(g);
    expect(untilDead(g, 60).id).toBe("vending");
  });

  it("walking away before it lands is safe", () => {
    const g = at(61.2, STREET);
    settle(g, 5);
    for (let i = 0; i < 4; i++) use(g);
    press(g, "left");
    run(g, 40);
    release(g, "left");
    expect(g.phase).toBe("alive");
    expect(g.vending!.phase).toBe("down");
  });

  it("planting yourself is Tried Being a Plant", () => {
    const g = at(34.6, 18);
    settle(g, 5);
    use(g);
    expect(g.player.planted).toBeGreaterThan(0);
    press(g, "left");
    expect(untilDead(g, 400).id).toBe("plant");
  });

  it("riding the washing line is Clothesline Express", () => {
    const g = at(23.3, 18);
    settle(g, 5);
    expect(prompt(g)).toBe("Ride the washing line");
    use(g);
    expect(untilDead(g, 200).id).toBe("clothesline");
    expect(g.last!.x).toBeLessThan(10);
  });

  it("the compactor button starts a slam", () => {
    const g = at(94.2, STREET);
    settle(g, 5);
    use(g);
    expect(g.compactor!.phase).toBe("warning");
  });

  it("the Death Board opens from the corkboard", () => {
    const g = at(34.5, STREET);
    drainEvents(g);
    use(g);
    expect(drainEvents(g).some((e) => e.type === "openBoard")).toBe(true);
  });

  it("talking to neighbours advances their lines, and Pell hands out crumbs", () => {
    const g = at(57.4, STREET);
    use(g);
    expect(g.player.crumbs).toBe(true);
    expect(g.talks.pell).toBe(1);
    const said = drainEvents(g).filter((e) => e.type === "speech");
    expect(said.at(-1)).toMatchObject({ who: "pell" });
  });
});

describe("zones and machines", () => {
  it("standing in the mirrors' focus is Solar Flair", () => {
    const g = at(98, 25);
    expect(untilDead(g, 300).id).toBe("solar");
  });

  it("standing under Juniper's drip is Rusted Through", () => {
    const g = at(36.4, 18);
    expect(untilDead(g, 400).id).toBe("rusted");
  });

  it("the crane magnet lifts you and drops you: Crane Game", () => {
    const g = at(104, STREET);
    for (let i = 0; i < 1500 && !g.crane!.player && g.phase === "alive"; i++) tick(g);
    expect(g.crane!.player).toBe(true);
    expect(untilDead(g, 900).id).toBe("crane");
  });

  it("the crane carries props too", () => {
    const g = at(30, STREET);
    const tire = g.bodies.find((b) => b.kind === "tire" && centerX(b) > 100)!;
    for (let i = 0; i < 1500 && !tire.lifted; i++) tick(g);
    expect(tire.lifted).toBe(true);
    for (let i = 0; i < 900 && tire.lifted; i++) tick(g);
    settle(g, 120);
    expect(centerX(tire)).toBeLessThan(101);
  });

  it("bringing Pell a crate is Crushed by Kindness", () => {
    const g = at(49.6, STREET);
    settle(g, 5);
    command(g, { type: "grab" });
    tick(g);
    expect(g.player.holding).not.toBeNull();
    holdUntil(g, "right", (g) => centerX(g.player) >= 55.4, 600);
    press(g, "down");
    command(g, { type: "grab" });
    tick(g);
    release(g, "down");
    expect(untilDead(g, 200).id).toBe("kindness");
  });

  it("crumbs, then standing still outdoors: Pigeon Rapture", () => {
    const g = at(57.4, STREET);
    use(g);
    expect(g.player.crumbs).toBe(true);
    holdUntil(g, "left", (g) => centerX(g.player) <= 54, 300);
    settle(g, 20);
    expect(prompt(g)).toBe("Scatter crumbs");
    use(g);
    expect(untilDead(g, 800).id).toBe("pigeons");
  });

  it("moving scares the pigeons off", () => {
    const g = at(57.4, STREET);
    use(g);
    holdUntil(g, "left", (g) => centerX(g.player) <= 54, 300);
    settle(g, 20);
    use(g);
    run(g, 30);
    jump(g, 10);
    run(g, 200);
    expect(g.phase).toBe("alive");
    expect(g.player.pigeons).toBe(0);
  });

  it("crumbs don't work indoors", () => {
    const g = at(57.4, STREET);
    use(g);
    const h = createGame({ ...buildBlock(), spawn: { x: 30, y: STREET } });
    h.player.crumbs = true;
    use(h);
    expect(h.player.pigeons).toBe(0);
    expect(h.player.crumbs).toBe(true);
    void g;
  });

  it("standing still for three minutes is Bored to Death", () => {
    const g = at(30, STREET);
    run(g, BORED_TICKS - 10);
    expect(g.phase).toBe("alive");
    expect(untilDead(g, 30).id).toBe("bored");
  });
});

describe("the power line", () => {
  it("is out of reach from the fire escape balcony", () => {
    for (let wait = 0; wait < 30; wait += 3) {
      const g = at(47.3, 24);
      settle(g, 5);
      press(g, "right");
      run(g, wait);
      jump(g, 40);
      run(g, 120);
      expect(g.last?.id ?? null).not.toBe("stairway");
    }
  });

  it("is reachable from a tower of old bodies on the dumpster lid: Stairway to Heaven", () => {
    const g = at(53.5, STREET);
    settle(g, 5);
    let y = 28.45;
    for (let i = 0; i < 4; i++) {
      g.bodies.push({
        id: g.nextId++, kind: "corpse", pose: "upright", tint: "none", attempt: 0,
        x: 53.15, y: y - 1.15, w: 0.7, h: 1.15, vx: 0, vy: 0, grounded: true, held: false, bonked: false,
      });
      y -= 1.15;
    }
    g.player.x = 53.15;
    g.player.y = y - g.player.h;
    settle(g, 10);
    expect(bottom(g.player)).toBeCloseTo(y, 3);
    jump(g, 40);
    expect(g.last!.id).toBe("stairway");
  });
});

describe("watchers", () => {
  it("dying in sight of all four neighbours adds Died of Embarrassment", () => {
    const g = at(58.2, STREET);
    settle(g, 5);
    kill(g, "power");
    expect(g.last!.bonus).toContain("embarrassment");
    expect(g.board.embarrassment?.count).toBe(1);
  });

  it("but not out of their sight", () => {
    const g = at(17, STREET);
    kill(g, "canal");
    expect(g.last!.bonus).toEqual([]);
  });

  it("a neighbour who saw it says something", () => {
    const g = at(57, STREET);
    drainEvents(g);
    kill(g, "power");
    expect(drainEvents(g).some((e) => e.type === "speech")).toBe(true);
  });
});

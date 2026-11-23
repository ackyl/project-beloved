import { describe, expect, it } from "vitest";
import { buildBlock, STREET } from "../game/level/block";
import { command, createGame, drainEvents, tick, type Game } from "../game/simulation";
import { kill, uniqueDeaths } from "../game/death";
import { TWIST_AT, TWIST_DARK_TICKS } from "../game/balance";
import type { Cause } from "../game/data/deaths";
import { erase, load, restore, save, serialize, SAVE_KEY, type Store } from "../game/save";
import { holdUntil, run } from "./helpers";
import { centerX } from "../game/physics";

const causes: Cause[] = ["fall", "tram", "compactor", "fryer", "canal", "vending", "power", "solar", "drip", "kindness", "pigeons", "zipline", "powerline", "bored", "planted"];
const untilAlive = (g: Game) => {
  for (let i = 0; i < 2000 && g.phase !== "alive"; i++) tick(g);
  expect(g.phase).toBe("alive");
};
function dieUnique(g: Game, n: number) {
  for (let i = 0; i < n; i++) {
    kill(g, causes[i], { fall: 9, watchers: 0 });
    untilAlive(g);
  }
}

describe("the twist", () => {
  it("runs low on feedstock after the threshold, goes dark on the next death, and rebuilds you", () => {
    const g = createGame();
    dieUnique(g, TWIST_AT - 1);
    expect(g.twist).toBe(0);
    dieUnique(g, 0);
    kill(g, causes[TWIST_AT - 1], { fall: 9, watchers: 0 });
    run(g, 2);
    expect(uniqueDeaths(g)).toBe(TWIST_AT);
    expect(g.twist).toBe(1);
    untilAlive(g);
    drainEvents(g);
    kill(g, "fall", { fall: 9, watchers: 0 });
    run(g, 2);
    expect(g.phase).toBe("twist");
    run(g, TWIST_DARK_TICKS);
    const said = drainEvents(g).filter((e) => e.type === "speech").map((e) => e.type === "speech" && e.who);
    expect(said).toEqual(expect.arrayContaining(["bas", "pell", "rook", "juniper"]));
    untilAlive(g);
    expect(g.twist).toBe(2);
    expect(g.rebuilt).toBe(true);
  });

  it("reading Rook's paper awards Died Laughing once, without counting an attempt", () => {
    const g = createGame({ ...buildBlock(), spawn: { x: 33.6, y: STREET } });
    g.twist = 2;
    const attempts = g.attempts;
    command(g, { type: "interact" });
    tick(g);
    expect(g.board.laughing).toEqual({ count: 1, first: attempts });
    expect(g.attempts).toBe(attempts);
    expect(g.party).toBeGreaterThan(0);
    const events = drainEvents(g);
    expect(events.some((e) => e.type === "death" && e.id === "laughing")).toBe(true);
    command(g, { type: "interact" });
    tick(g);
    expect(drainEvents(g).some((e) => e.type === "openBoard")).toBe(true);
    run(g, 600);
    expect(g.phase).toBe("alive");
  });

  it("does not trigger twice, and the game carries on after", () => {
    const g = createGame();
    g.twist = 2;
    g.rebuilt = true;
    dieUnique(g, 14);
    expect(g.twist).toBe(2);
    expect(g.phase).toBe("alive");
  });

  it("the paper is just the Death Board before the twist", () => {
    const g = createGame({ ...buildBlock(), spawn: { x: 33.6, y: STREET } });
    holdUntil(g, "right", (g) => centerX(g.player) >= 34, 60);
    command(g, { type: "interact" });
    tick(g);
    expect(g.board.laughing).toBeUndefined();
  });
});

describe("saving", () => {
  const memory = (): Store & { data: Map<string, string> } => {
    const data = new Map<string, string>();
    return {
      data,
      getItem: (k) => data.get(k) ?? null,
      setItem: (k, v) => void data.set(k, v),
      removeItem: (k) => void data.delete(k),
    };
  };

  it("round-trips attempts, the board, talks, the twist and every body", () => {
    const g = createGame();
    dieUnique(g, 5);
    g.talks.rook = 3;
    g.player.crumbs = true;
    const store = memory();
    expect(save(store, g)).toBe(true);
    const back = load(store)!;
    expect(back.attempts).toBe(5);
    expect(back.board).toEqual(g.board);
    expect(back.talks.rook).toBe(3);
    expect(back.player.crumbs).toBe(true);
    expect(back.bodies.filter((b) => b.kind === "corpse")).toHaveLength(5);
    expect(serialize(back).bodies).toEqual(serialize(g).bodies);
  });

  it("rejects garbage, other versions and broken payloads", () => {
    expect(restore("nope")).toBeNull();
    expect(restore(null)).toBeNull();
    expect(restore({ ...serialize(createGame()), v: 99 })).toBeNull();
    expect(restore({ ...serialize(createGame()), attempts: -1 })).toBeNull();
    const store = memory();
    store.setItem(SAVE_KEY, "{not json");
    expect(load(store)).toBeNull();
  });

  it("drops bodies that are invalid or inside walls, and unknown deaths", () => {
    const data = serialize(createGame());
    data.bodies.push({ kind: "corpse", x: NaN, y: 1, pose: "flat" });
    data.bodies.push({ kind: "crate", x: 30, y: 31 }); // inside the street
    data.bodies.push({ kind: "corpse", x: 30, y: 20, pose: "sideways" as never });
    (data.board as Record<string, unknown>).madeUp = { count: 1, first: 1 };
    const g = restore(data)!;
    expect(g.bodies).toHaveLength(createGame().bodies.length);
    expect(Object.keys(g.board)).toEqual([]);
  });

  it("survives storage that throws", () => {
    const broken: Store = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    };
    expect(load(broken)).toBeNull();
    expect(save(broken, createGame())).toBe(false);
    expect(() => erase(broken)).not.toThrow();
    expect(load(null)).toBeNull();
  });

  it("saving in the dark resumes as feedstock low, so the twist isn't skipped", () => {
    const g = createGame();
    g.twist = 1;
    dieUnique(g, 0);
    kill(g, "fall", { fall: 9, watchers: 0 });
    run(g, 2);
    expect(g.phase).toBe("twist");
    const back = restore(serialize(g))!;
    expect(back.twist).toBe(1);
    kill(back, "fall", { fall: 9, watchers: 0 });
    run(back, 2);
    expect(back.phase).toBe("twist");
  });
});

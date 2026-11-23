import { expect, test } from "vitest";
import { createGame, command } from "../game/simulation";
import { CARE_INTERVAL } from "../game/balance";
import { tick } from "../game/simulation";
test("research is local, observation-based and forgiving", () => {
  const g = createGame();
  command(g, { type: "test", id: "repair" });
  expect(g.tests.repair).toBe(false);
  g.bag.bloom = 1;
  g.x = 40;
  command(g, { type: "test", id: "repair" });
  expect(g.tests.repair).toBe(false);
  g.x = 15;
  command(g, { type: "test", id: "repair" });
  command(g, { type: "deduce", id: "support" });
  expect(g.learned).toBe(false);
  command(g, { type: "test", id: "resonance" });
  command(g, { type: "deduce", id: "seal" });
  expect(g.feedback).toContain("flex");
  expect(g.bag.bloom).toBe(1);
  command(g, { type: "craft" });
  expect(g.prepared).toBe(false);
  command(g, { type: "deduce", id: "support" });
  command(g, { type: "craft" });
  expect(g.prepared).toBe(true);
});
test("care saturates indefinitely, duplicate doses safe, annex can be found after early care", () => {
  const g = createGame();
  for (let i = 0; i < CARE_INTERVAL * 3; i++) tick(g);
  expect(g.careAge).toBe(CARE_INTERVAL);
  command(g, { type: "care" });
  expect(g.treated).toBe(false);
  g.prepared = true;
  command(g, { type: "care" });
  expect(g.treated).toBe(true);
  expect(g.careAge).toBe(0);
  g.prepared = true;
  command(g, { type: "care" });
  expect(g.prepared).toBe(true);
  g.panelOpen = true;
  command(g, { type: "care" });
  expect(g.revealed).toBe(true);
});
test("single upgrade uses both locker and bag and never gates treatment", () => {
  const g = createGame();
  command(g, { type: "upgrade" });
  expect(g.capacity).toBe(8);
  g.bag.copper = 1;
  command(g, { type: "stow" });
  g.bag.copper = 1;
  command(g, { type: "upgrade" });
  command(g, { type: "upgrade" });
  expect(g.capacity).toBe(10);
  expect(g.stores.copper + g.bag.copper).toBe(0);
});
test("recurring care can reuse the culture and has no deadline", () => {
  const g = createGame();
  g.learned = true;
  g.bag.bloom = 1;
  g.panelOpen = true;
  for (let round = 0; round < 3; round++) {
    for (let i = 0; i < CARE_INTERVAL + 10; i++) tick(g);
    command(g, { type: "craft" });
    command(g, { type: "care" });
    expect(g.careAge).toBe(0);
    expect(g.bag.bloom).toBe(1);
    expect(g.revealed).toBe(true);
  }
});

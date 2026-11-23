import { expect, it } from "vitest";
import { createGame } from "../game/state";
import { erase, save } from "../game/save";
import { hasSeenGuide, rememberGuide } from "../platform/guide";

it("remembers the first-visit guide independently of game progress", () => {
  const entries = new Map<string, string>();
  const store = {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => entries.set(key, value),
    removeItem: (key: string) => entries.delete(key),
  };

  save(store, createGame());
  expect(hasSeenGuide(store)).toBe(false);
  rememberGuide(store);
  expect(hasSeenGuide(store)).toBe(true);
  erase(store);
  expect(hasSeenGuide(store)).toBe(true);
});

it("keeps the guide available when browser storage is unavailable", () => {
  expect(hasSeenGuide(null)).toBe(false);
  expect(() => rememberGuide(null)).not.toThrow();
});

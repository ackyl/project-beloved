import { describe, expect, it } from "vitest";
import { isDesktop, MIN_DESKTOP_WIDTH } from "../platform/device";

const desktop = { coarse: false, hover: true, width: 1365, override: false };

describe("desktop gate", () => {
  it("lets a mouse-and-keyboard desktop through", () => {
    expect(isDesktop(desktop)).toBe(true);
  });
  it("blocks a phone with a touch-only pointer", () => {
    expect(
      isDesktop({ coarse: true, hover: false, width: 390, override: false }),
    ).toBe(false);
  });
  it("blocks a large touch-only tablet", () => {
    expect(
      isDesktop({ coarse: true, hover: false, width: 1024, override: false }),
    ).toBe(false);
  });
  it("allows a touchscreen laptop that also has a hovering pointer", () => {
    expect(isDesktop({ ...desktop, coarse: true })).toBe(true);
  });
  it("blocks a narrow window", () => {
    expect(isDesktop({ ...desktop, width: MIN_DESKTOP_WIDTH - 1 })).toBe(false);
    expect(isDesktop({ ...desktop, width: MIN_DESKTOP_WIDTH })).toBe(true);
  });
  it("respects the override", () => {
    expect(
      isDesktop({ coarse: true, hover: false, width: 320, override: true }),
    ).toBe(true);
  });
});

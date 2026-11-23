import { expect, it } from "vitest";
import { city } from "../rendering/scenery";
import type { Brush } from "../rendering/pixels";

it("keeps skyline window lights attached to their floors as the camera moves", () => {
  const gradient = { addColorStop() {} };
  const c = {
    createLinearGradient: () => gradient,
    createRadialGradient: () => gradient,
    fillRect() {},
  } as unknown as Brush;
  const w = 400;
  const h = 300;
  const windows = (camX: number, camY: number, dx: number, dy: number) => {
    const lamps: string[] = [];
    city(c, (x, y, width, height, color) => {
      if (width !== 3 || height !== 3 || !["#678998", "#ae938f", "#586e86"].includes(color)) return;
      const worldX = x + dx;
      const worldY = y + dy;
      if (worldX > 20 && worldX < w - 20 && worldY > 20 && worldY < h - 20) {
        lamps.push(`${worldX},${worldY}:${color}`);
      }
    }, w, h, camX, camY);
    return lamps.sort();
  };
  const stationary = windows(0, 0, 0, 0);
  expect(stationary.length).toBeGreaterThan(10);
  // This layer moves 0.26 horizontally and 0.32 vertically per camera pixel.
  expect(windows(25, 25, 7, 8)).toEqual(stationary);
});

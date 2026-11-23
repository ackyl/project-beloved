import { useLayoutEffect, useRef } from "react";
import { brush, iconColors, itemArt, sprite } from "../rendering/pixels";
import type { Item } from "../game/world";
export type Glyph =
  | "brand"
  | "log"
  | "sound"
  | "mute"
  | "pause"
  | "bloom"
  | "copper"
  | "crystal"
  | "pack"
  | "target"
  | "depth"
  | "cross"
  | "pulse"
  | "close"
  | "compass";
const paths: Partial<Record<Glyph, number[][]>> = {
  log: [
    [3, 2, 13, 2, 13, 14, 3, 14, 3, 2],
    [5, 2, 5, 14],
    [7, 6, 11, 6],
    [7, 9, 10, 9],
  ],
  sound: [
    [2, 6, 5, 6, 9, 3, 9, 13, 5, 10, 2, 10, 2, 6],
    [11, 5, 13, 7, 13, 9, 11, 11],
    [13, 2, 15, 5, 15, 11, 13, 14],
  ],
  mute: [
    [1, 6, 4, 6, 8, 3, 8, 13, 4, 10, 1, 10, 1, 6],
    [11, 6, 15, 10],
    [15, 6, 11, 10],
  ],
  pack: [
    [3, 5, 13, 5, 14, 13, 13, 14, 3, 14, 2, 13, 3, 5],
    [5, 4, 5, 2, 11, 2, 11, 4],
    [3, 9, 13, 9],
    [7, 8, 9, 8, 9, 11, 7, 11, 7, 8],
  ],
  target: [
    [8, 1, 14, 7, 14, 9, 8, 15, 2, 9, 2, 7, 8, 1],
    [8, 5, 11, 8, 8, 11, 5, 8, 8, 5],
  ],
  depth: [
    [4, 2, 4, 11, 8, 15, 12, 11],
    [8, 1, 8, 10],
    [11, 4, 14, 4],
    [11, 7, 13, 7],
  ],
  cross: [
    [
      6, 2, 10, 2, 10, 6, 14, 6, 14, 10, 10, 10, 10, 14, 6, 14, 6, 10, 2, 10, 2,
      6, 6, 6, 6, 2,
    ],
  ],
  pulse: [[0, 9, 4, 9, 6, 4, 8, 13, 10, 6, 12, 9, 16, 9]],
  close: [
    [3, 3, 13, 13],
    [13, 3, 3, 13],
  ],
  compass: [[8, 1, 13, 14, 8, 11, 3, 14, 8, 1]],
};
export function Icon({ name, size = 18 }: { name: Glyph; size?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const canvas = ref.current!,
      c = canvas.getContext("2d")!,
      r = brush(c);
    c.clearRect(0, 0, 16, 16);
    const color = getComputedStyle(canvas).color;
    if (Object.hasOwn(itemArt, name)) {
      sprite(r, 2, 3, itemArt[name as Item], iconColors);
      return;
    }
    if (name === "pause") {
      r(4, 3, 3, 10, color);
      r(10, 3, 3, 10, color);
      return;
    }
    if (name === "brand") {
      for (let i = 0; i < 3; i++) {
        const y = 2 + i * 4;
        for (let x = 0; x < 12; x += 2)
          r(
            2 + x,
            y + Math.min(x, 10 - x) / 2,
            2,
            2,
            i === 2 ? "#d6a16b" : "#f2c38e",
          );
      }
      return;
    }
    for (const points of paths[name] ?? []) {
      c.beginPath();
      c.strokeStyle = color;
      c.lineWidth = 1.3;
      for (let i = 0; i < points.length; i += 2) {
        if (i) c.lineTo(points[i] + 0.5, points[i + 1] + 0.5);
        else c.moveTo(points[i] + 0.5, points[i + 1] + 0.5);
      }
      c.stroke();
    }
  }, [name]);
  return (
    <canvas
      className="icon"
      ref={ref}
      width="16"
      height="16"
      aria-hidden="true"
      style={{ width: size, height: size }}
    />
  );
}
const letters: Record<string, string> = {
  B: "11110 11001 11001 11110 11001 11001 11110",
  E: "11111 11000 11000 11110 11000 11000 11111",
  L: "11000 11000 11000 11000 11000 11000 11111",
  O: "01110 11001 11001 11001 11001 11001 01110",
  W: "10001 10001 10001 10101 10101 11111 01010",
  V: "10001 10001 10001 10001 11011 01010 00100",
  D: "11110 11001 11001 11001 11001 11001 11110",
  ",": "00 00 00 00 00 01 10",
  " ": "00 00 00 00 00 00 00",
};
export function Wordmark() {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const c = ref.current!.getContext("2d")!,
      r = brush(c);
    let x = 0;
    for (const ch of "BELOW, BELOVED") {
      const rows = letters[ch].split(" ");
      sprite(r, x, 0, rows, { "1": "#ece8d9" });
      x += rows[0].length + 1;
    }
  }, []);
  return (
    <h1 aria-label="Below, Beloved">
      <canvas aria-hidden="true" ref={ref} width={77} height={7} />
    </h1>
  );
}

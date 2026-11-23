import { useEffect, useRef } from "react";
import type { Game } from "../game/simulation";
import { at, HOME } from "../game/world";
import { objective } from "../game/objective";
export function Survey({ g }: { g: Game }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!.getContext("2d")!,
      w = c.canvas.width,
      h = c.canvas.height,
      s = 3;
    const ox = Math.floor(g.x) - Math.floor(w / s / 2),
      oy = Math.floor(g.y) - Math.floor(h / s / 2);
    c.fillStyle = "#152522";
    c.fillRect(0, 0, w, h);
    for (let y = 0; y < h / s; y++)
      for (let x = 0; x < w / s; x++) {
        const t = at(g.world, ox + x, oy + y);
        if (t.kind !== "empty") {
          c.fillStyle = t.kind === "shell" ? "#4a6153" : "#324e42";
          c.fillRect(x * s, y * s, s, s);
        }
      }
    for (let x = 0; x < w; x += 9)
      for (let y = 0; y < h; y += 9) {
        c.fillStyle = "#607b614f";
        c.fillRect(x, y, 1, 1);
      }
    const mark = (x: number, y: number, col: string) => {
      const px = Math.max(1, Math.min(w - 4, Math.floor((x - ox) * s))),
        py = Math.max(1, Math.min(h - 4, Math.floor((y - oy) * s)));
      c.fillStyle = col;
      c.fillRect(px - 1, py, 3, 1);
      c.fillRect(px, py - 1, 1, 3);
    };
    mark(HOME.x, HOME.y, "#c9b38a");
    const point = objective(g).point;
    if (point) mark(point.x, point.y, "#cb9adc");
    mark(g.x, g.y, "#c1ffcf");
  });
  return (
    <div className="survey">
      <div className="micro">
        <i /> LOCAL SCAN
      </div>
      <canvas
        ref={ref}
        width="87"
        height="39"
        aria-label="Local map. Green marks your position and lilac marks the objective."
      />
    </div>
  );
}

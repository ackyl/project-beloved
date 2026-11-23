import { useEffect, useRef } from "react";
import { command, tick, type Game } from "../game/simulation";
import { STEP } from "../game/balance";
import { scene } from "../rendering/drawWorld";

/** Fixed-step loop: requestAnimationFrame is the clock, the simulation runs at 60 Hz. */
export function GameCanvas({
  game,
  paused,
  reduced,
  onFrame,
}: {
  game: Game;
  paused: boolean;
  reduced: boolean;
  onFrame: () => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null),
    latest = useRef({ paused, reduced, onFrame });
  latest.current = { paused, reduced, onFrame };
  useEffect(() => {
    const canvas = ref.current!,
      ctx = canvas.getContext("2d")!,
      viewport = canvas.parentElement!,
      draw = scene();
    let id = 0,
      last = 0,
      acc = 0,
      active = document.hasFocus();
    const resize = () => {
      const { width, height } = viewport.getBoundingClientRect();
      const scale = Math.max(1.5, Math.min(3.6, height / 300));
      const dpr = window.devicePixelRatio || 1;
      const pixel = Math.max(1, Math.round(dpr * scale));
      const backingWidth = Math.max(1, Math.ceil((width * dpr) / pixel));
      const backingHeight = Math.max(1, Math.ceil((height * dpr) / pixel));
      if (canvas.width !== backingWidth) canvas.width = backingWidth;
      if (canvas.height !== backingHeight) canvas.height = backingHeight;
      // Fill the viewport with whole device pixels and clip the fractional edge.
      canvas.style.width = (backingWidth * pixel) / dpr + "px";
      canvas.style.height = (backingHeight * pixel) / dpr + "px";
      ctx.imageSmoothingEnabled = false;
    };
    const observer = new ResizeObserver(resize);
    observer.observe(viewport);
    window.addEventListener("resize", resize);
    resize();
    const reset = () => {
      last = 0;
      acc = 0;
      active = document.hasFocus();
      command(game, { type: "clear" });
    };
    document.addEventListener("visibilitychange", reset);
    window.addEventListener("blur", reset);
    window.addEventListener("focus", reset);
    const frame = (now: number) => {
      if (active && !document.hidden && !latest.current.paused) {
        acc += last ? Math.min((now - last) / 1000, 0.09) : 0;
        while (acc >= STEP) {
          tick(game);
          acc -= STEP;
        }
      } else acc = 0;
      last = now;
      draw(ctx, game, latest.current.reduced);
      latest.current.onFrame();
      id = requestAnimationFrame(frame);
    };
    id = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(id);
      observer.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("focus", reset);
      window.removeEventListener("blur", reset);
      document.removeEventListener("visibilitychange", reset);
    };
  }, [game]);
  return (
    <canvas
      ref={ref}
      aria-label="Side view of the block, including the walk-up, the street and the scrapyard."
    />
  );
}

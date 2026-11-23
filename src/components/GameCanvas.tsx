import { useEffect, useRef } from "react";
import { command, tick, type Game } from "../game/simulation";
import { STEP } from "../game/balance";
import { scene } from "../rendering/drawWorld";

export function GameCanvas({
  game,
  paused,
  onFrame,
  reduced,
}: {
  game: Game;
  paused: boolean;
  onFrame: () => void;
  reduced: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null),
    latest = useRef({ paused, onFrame, reduced });
  latest.current = { paused, onFrame, reduced };
  useEffect(() => {
    const canvas = ref.current!,
      ctx = canvas.getContext("2d")!,
      draw = scene(game);
    let id = 0,
      last = 0,
      acc = 0,
      active = document.hasFocus();
    const resize = () => {
      const scale = Math.max(1.5, Math.min(3.6, canvas.clientHeight / 340));
      const dpr = window.devicePixelRatio || 1,
        pixel = Math.max(1, Math.round(dpr * scale));
      canvas.width = Math.max(
        1,
        Math.round((canvas.clientWidth * dpr) / pixel),
      );
      canvas.height = Math.max(
        1,
        Math.round((canvas.clientHeight * dpr) / pixel),
      );
      ctx.imageSmoothingEnabled = false;
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
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
    const setPos = (key: string, value: number) =>
      canvas.parentElement!.style.setProperty(
        key,
        (value * 100).toFixed(2) + "%",
      );
    const frame = (now: number) => {
      if (active && !document.hidden && !latest.current.paused) {
        acc += last ? Math.min((now - last) / 1000, 0.09) : 0;
        while (acc >= STEP) {
          tick(game);
          acc -= STEP;
        }
      } else acc = 0;
      last = now;
      const p = draw(ctx, latest.current.reduced);
      setPos("--player-x", p.px);
      setPos("--player-y", p.py);
      setPos("--home-x", p.homeX);
      setPos("--home-y", p.homeY);
      latest.current.onFrame();
      id = requestAnimationFrame(frame);
    };
    id = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(id);
      observer.disconnect();
      window.removeEventListener("focus", reset);
      window.removeEventListener("blur", reset);
      document.removeEventListener("visibilitychange", reset);
    };
  }, [game]);
  return (
    <canvas
      ref={ref}
      aria-label="Side-view cavern. Float with WASD or arrow keys, and hold into rock to excavate."
    />
  );
}

import { useEffect, useRef, type PointerEvent } from "react";
import { command, type Direction, type Game } from "../game/simulation";
import { joystickDirections } from "../platform/joystick";

export function TouchControls({
  game,
  carrying,
  paused,
}: {
  game: Game;
  carrying: boolean;
  paused: boolean;
}) {
  const stick = useRef<HTMLDivElement>(null);
  const pointer = useRef<number | null>(null);
  const directions = useRef<Direction[]>([]);

  function move(next: Direction[], x = 0, y = 0) {
    for (const dir of directions.current) {
      if (!next.includes(dir)) command(game, { type: "move", dir, pressed: false, source: `touch-${dir}` });
    }
    for (const dir of next) {
      if (!directions.current.includes(dir)) command(game, { type: "move", dir, pressed: true, source: `touch-${dir}` });
    }
    directions.current = next;
    stick.current?.style.setProperty("--stick-x", `${x}px`);
    stick.current?.style.setProperty("--stick-y", `${y}px`);
  }

  function release() {
    const id = pointer.current;
    if (id === null) return;
    pointer.current = null;
    if (stick.current?.hasPointerCapture(id)) stick.current.releasePointerCapture(id);
    move([]);
  }

  useEffect(() => {
    if (paused) release();
    window.addEventListener("blur", release);
    window.addEventListener("resize", release);
    document.addEventListener("visibilitychange", release);
    return () => {
      window.removeEventListener("blur", release);
      window.removeEventListener("resize", release);
      document.removeEventListener("visibilitychange", release);
      release();
    };
  }, [game, paused]);

  function track(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerId !== pointer.current) return;
    const box = event.currentTarget.getBoundingClientRect();
    const radius = Math.min(box.width, box.height) / 2;
    if (!radius) return;
    const x = (event.clientX - box.left - box.width / 2) / radius;
    const y = (event.clientY - box.top - box.height / 2) / radius;
    const travel = radius * 0.55 / Math.max(1, Math.hypot(x, y));
    move(joystickDirections(x, y), x * travel, y * travel);
  }

  function start(event: PointerEvent<HTMLDivElement>) {
    if (paused || pointer.current !== null || event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    pointer.current = event.pointerId;
    track(event);
  }

  function finish(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerId === pointer.current) release();
  }

  return (
    <div className="touch-controls" role="group" aria-label="Touch controls" inert={paused}>
      <div className="touch-actions">
        <button className="touch-grab" type="button" onClick={() => command(game, { type: "grab" })}>
          {carrying ? "Throw" : "Grab"}
        </button>
        <button type="button" onClick={() => command(game, { type: "interact" })}>Use</button>
      </div>
      <div
        className="joystick"
        role="group"
        aria-label="Movement joystick. Drag left or right to walk, up to jump or climb, and down to descend."
        ref={stick}
        onPointerDown={start}
        onPointerMove={track}
        onPointerUp={finish}
        onPointerCancel={finish}
        onLostPointerCapture={finish}
        onContextMenu={(event) => event.preventDefault()}
      >
        <span className="stick-up" aria-hidden="true">↑</span>
        <span className="stick-left" aria-hidden="true">←</span>
        <span className="stick-right" aria-hidden="true">→</span>
        <span className="stick-down" aria-hidden="true">↓</span>
        <span className="stick-knob" aria-hidden="true" />
      </div>
    </div>
  );
}

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { command, type Direction, type Game } from "../game/simulation";

const arrows: { dir: Direction; glyph: string; label: string }[] = [
  { dir: "up", glyph: "↑", label: "Jump or climb up" },
  { dir: "left", glyph: "←", label: "Walk left" },
  { dir: "down", glyph: "↓", label: "Climb down or drop" },
  { dir: "right", glyph: "→", label: "Walk right" },
];

export function TouchControls({
  game,
  carrying,
  paused,
}: {
  game: Game;
  carrying: boolean;
  paused: boolean;
}) {
  const pointers = useRef(new Map<number, { dir: Direction; button: HTMLButtonElement }>());
  const [pressed, setPressed] = useState<Direction[]>([]);

  function updatePressed() {
    setPressed(Array.from(pointers.current.values(), ({ dir }) => dir));
  }

  function start(event: PointerEvent<HTMLButtonElement>, dir: Direction) {
    if (paused || event.button !== 0 || pointers.current.has(event.pointerId)) return;
    event.preventDefault();
    const button = event.currentTarget;
    button.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { dir, button });
    command(game, { type: "move", dir, pressed: true, source: `touch-${event.pointerId}` });
    updatePressed();
  }

  function release(id: number) {
    const touch = pointers.current.get(id);
    if (!touch) return;
    pointers.current.delete(id);
    if (touch.button.hasPointerCapture(id)) touch.button.releasePointerCapture(id);
    command(game, { type: "move", dir: touch.dir, pressed: false, source: `touch-${id}` });
    updatePressed();
  }

  useEffect(() => {
    function clear() {
      for (const id of pointers.current.keys()) release(id);
    }

    window.addEventListener("blur", clear);
    window.addEventListener("resize", clear);
    document.addEventListener("visibilitychange", clear);
    return () => {
      window.removeEventListener("blur", clear);
      window.removeEventListener("resize", clear);
      document.removeEventListener("visibilitychange", clear);
      clear();
    };
  }, [game, paused]);

  return (
    <div className="touch-controls" role="group" aria-label="Touch controls" inert={paused}>
      <div className="touch-actions">
        <button className="touch-grab" type="button" onClick={() => command(game, { type: "grab" })}>
          {carrying ? "Throw" : "Grab"}
        </button>
        <button type="button" onClick={() => command(game, { type: "interact" })}>Use</button>
      </div>
      <div className="dpad" role="group" aria-label="Movement D-pad">
        {arrows.map(({ dir, glyph, label }) => (
          <button
            key={dir}
            className={`dpad-${dir}`}
            type="button"
            aria-label={label}
            data-pressed={pressed.includes(dir)}
            onPointerDown={(event) => start(event, dir)}
            onPointerUp={(event) => release(event.pointerId)}
            onPointerCancel={(event) => release(event.pointerId)}
            onLostPointerCapture={(event) => release(event.pointerId)}
            onContextMenu={(event) => event.preventDefault()}
          >{glyph}</button>
        ))}
      </div>
    </div>
  );
}

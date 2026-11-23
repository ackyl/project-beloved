import type { Direction } from "../game/simulation";
export const arrows = { up: "↑", left: "←", down: "↓", right: "→" };
export function TouchControls({
  move,
}: {
  move: (dir: Direction, pressed: boolean, source: string) => void;
}) {
  return (
    <div className="pad">
      {(Object.keys(arrows) as Direction[]).map((d) => (
        <button
          key={d}
          className={d}
          aria-label={"Move " + d}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            move(d, true, "touch-" + e.pointerId);
          }}
          onPointerUp={(e) => move(d, false, "touch-" + e.pointerId)}
          onLostPointerCapture={(e) => move(d, false, "touch-" + e.pointerId)}
          onPointerCancel={(e) => move(d, false, "touch-" + e.pointerId)}
        >
          {arrows[d]}
        </button>
      ))}
    </div>
  );
}

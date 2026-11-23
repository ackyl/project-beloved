import { BOARD, deathById } from "../game/data/deaths";
import type { Game } from "../game/state";
import { Icon } from "./Icon";
import { stars } from "./DeathCard";

export function DeathBoard({ g, close }: { g: Game; close: () => void }) {
  const found = BOARD.filter((d) => g.board[d.id]).length;
  const laughing = g.board.laughing ? deathById.laughing : null;
  return (
    <div className="dialog board" role="dialog" aria-modal="true" aria-labelledby="board-title">
      <div className="dialog-head">
        <div>
          <h2 id="board-title">Death Board</h2>
          <p className="micro">
            {found} of {BOARD.length} found · {g.attempts} attempts
            {g.carted ? ` · ${g.carted} carted away by Bas` : ""}
          </p>
        </div>
        <button className="square" aria-label="Close Death Board" onClick={close}>
          <Icon name="close" />
        </button>
      </div>
      <ol className="polaroids">
        {BOARD.map((d) => {
          const entry = g.board[d.id];
          return (
            <li key={d.id} className={entry ? "found" : "locked"}>
              <span className="num">#{d.n}</span>
              {entry ? (
                <>
                  <strong>{d.name}</strong>
                  <span className="joke">{d.joke}</span>
                  <span className="meta">
                    <b className="stars">{stars(d.stars)}</b> ×{entry.count}
                  </span>
                </>
              ) : (
                <>
                  <strong>{d.secret ? "Secret" : "???"}</strong>
                  <span className="hint">Rook: “{d.hint}”</span>
                  {d.corpses ? <span className="meta">Needs old bodies</span> : null}
                </>
              )}
            </li>
          );
        })}
        {laughing ? (
          <li className="found twist">
            <span className="num">#{laughing.n}</span>
            <strong>{laughing.name}</strong>
            <span className="joke">{laughing.joke}</span>
          </li>
        ) : null}
      </ol>
    </div>
  );
}

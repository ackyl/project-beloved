import { deathById, UNCATALOGUED } from "../game/data/deaths";
import type { LastDeath } from "../game/state";

const pad = (n: number) => String(n).padStart(3, "0");
export const stars = (n: number) => "★".repeat(n) + "☆".repeat(5 - n);

export function DeathCard({ death }: { death: LastDeath }) {
  const def = death.id ? deathById[death.id] : null;
  if (def?.twist)
    return (
      <div className="death-card new twist" role="status">
        <p className="card-top">
          <span>Not an attempt</span>
          <b className="badge">New</b>
        </p>
        <h2>
          <span className="num">#{def.n}</span>
          {def.name}
        </h2>
        <p className="joke">{def.joke}</p>
        <p className="rook">
          <span>Rook:</span> <b className="stars">{stars(5)}</b> obviously.
        </p>
        <p className="log">Human: provisionally confirmed. Learned: {def.learned}</p>
      </div>
    );
  return (
    <div className={`death-card${death.isNew ? " new" : ""}`} role="status">
      <p className="card-top">
        <span>Attempt {pad(death.attempt)}</span>
        {def ? (
          death.isNew ? (
            <b className="badge">New</b>
          ) : (
            <b className="badge repeat">Repeat ×{death.count}</b>
          )
        ) : (
          <b className="badge repeat">Doesn't count</b>
        )}
      </p>
      <h2>
        {def ? <span className="num">#{def.n}</span> : null}
        {def?.name ?? UNCATALOGUED.name}
      </h2>
      <p className="joke">{def?.joke ?? UNCATALOGUED.joke}</p>
      <p className="rook">
        <span>Rook:</span>{" "}
        {def && death.isNew ? <b className="stars">{stars(def.stars)}</b> : "boring."}
      </p>
      <p className="log">
        Still not human. Learned: {def?.learned ?? UNCATALOGUED.learned}
      </p>
      {death.bonus.map((id) => (
        <p className="bonus" key={id}>
          Also unlocked: #{deathById[id].n} {deathById[id].name}
        </p>
      ))}
    </div>
  );
}

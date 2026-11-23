import { command, type Game } from "../game/simulation";
import {
  assays,
  formulas,
  type BaseCommand,
  type Formula,
  type TestId,
} from "../game/research";
import { CARE_INTERVAL } from "../game/balance";
import { useState } from "react";
export function BasePanel({
  g,
  close,
  refresh,
}: {
  g: Game;
  close: () => void;
  refresh: () => void;
}) {
  const [tab, setTab] = useState<"Research" | "Care" | "Workshop">(
    g.prepared ? "Care" : "Research",
  );
  function send(c: BaseCommand) {
    command(g, c);
    refresh();
  }
  const canCare =
    g.prepared &&
    (!g.treated || g.careAge >= CARE_INTERVAL || (g.panelOpen && !g.revealed));
  return (
    <section
      className="dialog base-panel"
      role="dialog"
      aria-modal="true"
      aria-label="Sanctuary console"
    >
      <div className="dialog-top">
        <small>SANCTUARY / LOCAL TERMINAL</small>
        <button aria-label="Close console" onClick={close}>
          ×
        </button>
      </div>
      <h2>Sanctuary console</h2>
      <nav>
        {(["Research", "Care", "Workshop"] as const).map((t) => (
          <button
            aria-pressed={tab === t}
            key={t}
            onClick={() => {
              setTab(t);
              g.feedback = "";
            }}
          >
            {t}
          </button>
        ))}
      </nav>
      {tab === "Research" && (
        <>
          <h3>{g.bag.bloom ? "Lumen bloom" : "Specimen cradle empty"}</h3>
          {!g.bag.bloom ? (
            <p>
              A faint signal comes from beneath the eastern shelf. Bring a bloom
              back to the cradle.
            </p>
          ) : (
            <>
              {(Object.keys(assays) as TestId[]).map((id) => (
                <div className="assay" key={id}>
                  <div>
                    <b>{assays[id].name}</b>
                    <p>
                      {g.tests[id]
                        ? assays[id].result
                        : assays[id].action + "."}
                    </p>
                  </div>
                  <button
                    disabled={g.tests[id]}
                    onClick={() => send({ type: "test", id })}
                  >
                    {g.tests[id] ? "Logged" : "Run test"}
                  </button>
                </div>
              ))}
              {g.tests.repair && g.tests.resonance && !g.learned && (
                <>
                  <h3>Which formula fits both observations?</h3>
                  <div className="choices">
                    {(Object.keys(formulas) as Formula[]).map((id) => (
                      <button
                        key={id}
                        onClick={() => send({ type: "deduce", id })}
                      >
                        {formulas[id]}
                      </button>
                    ))}
                  </div>
                </>
              )}
              {g.learned && (
                <button
                  className="primary"
                  disabled={g.prepared}
                  onClick={() => send({ type: "craft" })}
                >
                  {g.prepared ? "Dose prepared" : "Prepare breathing treatment"}
                </button>
              )}
              {g.prepared && (
                <button
                  onClick={() => {
                    setTab("Care");
                    g.feedback = "";
                  }}
                >
                  Approach the curtain →
                </button>
              )}
            </>
          )}
        </>
      )}
      {tab === "Care" && (
        <>
          <h3>Behind the curtain</h3>
          <div
            className={"monitor " + (g.treated ? "steady" : "")}
            aria-hidden="true"
          >
            ▁▁▂▆▃▁▁▂▆▃▁▁▂▆▃▁▁
          </div>
          <p>
            {g.careAge >= CARE_INTERVAL
              ? "Breathing is shallow. A dose would ease the strain."
              : g.treated
                ? "Breathing is even. The monitor glows softly."
                : "A quiet, uneven breath. The curtain stays drawn."}
          </p>
          <button
            className="primary"
            disabled={!canCare}
            onClick={() => send({ type: "care" })}
          >
            Administer treatment
          </button>
          {!g.prepared && !g.treated && (
            <p>Prepare a dose at the research console.</p>
          )}
        </>
      )}
      {tab === "Workshop" && (
        <>
          <h3>Field pannier</h3>
          <p>
            {g.capacity} slots, including one lined specimen pocket. An
            extension adds two mineral slots.
          </p>
          <button
            disabled={g.upgraded || g.bag.copper + g.stores.copper < 2}
            onClick={() => send({ type: "upgrade" })}
          >
            {g.upgraded ? "Extension fitted" : "Fit extension · 2 copper"}
          </button>
          <h3>Mineral locker</h3>
          <p>
            {g.stores.copper} copper · {g.stores.crystal} prism shards in
            storage
          </p>
          <button
            disabled={!g.bag.copper && !g.bag.crystal}
            onClick={() => send({ type: "stow" })}
          >
            Stow carried minerals
          </button>
        </>
      )}
      {g.feedback && (
        <p className="feedback" role="status">
          {g.feedback}
        </p>
      )}
      {g.revealed && tab === "Care" && (
        <button onClick={close}>Return to the hollow →</button>
      )}
    </section>
  );
}

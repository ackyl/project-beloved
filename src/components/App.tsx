import { useEffect, useRef, useState } from "react";
import {
  atHome,
  command,
  createGame,
  nearPanel,
  type Direction,
} from "../game/simulation";
import { CARE_INTERVAL, OPEN_TICKS } from "../game/balance";
import { objective } from "../game/objective";
import { Sound } from "../game/sound";
import { GameCanvas } from "./GameCanvas";
import { TouchControls } from "./TouchControls";
import { BasePanel } from "./BasePanel";
import { Icon, Wordmark } from "./Graphics";
import { Survey } from "./Survey";

type Modal = "base" | "pause" | "log" | null;
const keys: Record<string, Direction> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
  a: "left",
  d: "right",
  w: "up",
  s: "down",
};
const itemNames = {
  copper: "Copper",
  crystal: "Prism",
  bloom: "Bloom",
} as const;
const number = (n: number) => String(n).padStart(2, "0");
export function App() {
  const [g, setGame] = useState(createGame),
    [modal, setModal] = useState<Modal>(null),
    [seedText, setSeedText] = useState(String(g.seed));
  const [, setRevision] = useState(0),
    refresh = () => setRevision((n) => n + 1);
  const [sound] = useState(() => new Sound()),
    [audio, setAudio] = useState(false);
  const [reduced, setReduced] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const prev = useRef(""),
    lastSound = useRef({ impact: -1, note: -1000 });
  const overlay = useRef<HTMLDivElement>(null),
    returnFocus = useRef<HTMLElement | null>(null),
    sceneFocus = useRef<HTMLElement>(null);
  const change = (m: Modal) => {
    if (m && !modal)
      returnFocus.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
    command(g, { type: "clear" });
    g.feedback = "";
    setModal(m);
  };
  useEffect(() => {
    if (!modal) {
      if (returnFocus.current) {
        const target = returnFocus.current.isConnected
          ? returnFocus.current
          : sceneFocus.current;
        target?.focus({ preventScroll: true });
        returnFocus.current = null;
      }
      return;
    }
    const box = overlay.current!,
      first = box.querySelector<HTMLElement>("button:not(:disabled)");
    first?.focus({ preventScroll: true });
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const all = [
          ...box.querySelectorAll<HTMLElement>("button:not(:disabled),input"),
        ],
        first = all[0],
        last = all.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    box.addEventListener("keydown", trap);
    return () => box.removeEventListener("keydown", trap);
  }, [modal]);
  useEffect(() => {
    const q = matchMedia("(prefers-reduced-motion: reduce)"),
      pref = () => setReduced(q.matches);
    const active = () => {
      if (document.hidden || !document.hasFocus()) sound.silence();
      else sound.wake();
    };
    q.addEventListener("change", pref);
    window.addEventListener("blur", active);
    window.addEventListener("focus", active);
    document.addEventListener("visibilitychange", active);
    return () => {
      q.removeEventListener("change", pref);
      window.removeEventListener("blur", active);
      window.removeEventListener("focus", active);
      document.removeEventListener("visibilitychange", active);
    };
  }, [sound]);
  const interact = (active: boolean) => {
    if (!modal && active && atHome(g)) {
      change("base");
      return;
    }
    if (!modal) command(g, { type: "hold", active });
  };
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const down = e.type === "keydown",
        k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (e.metaKey || e.altKey || e.ctrlKey) return;
      if (k === "Escape" && down && !e.repeat) {
        e.preventDefault();
        change(modal ? null : "pause");
        return;
      }
      if (e.target instanceof HTMLInputElement) return;
      if (
        k === "j" &&
        down &&
        !e.repeat &&
        (modal === null || modal === "log")
      ) {
        change(modal ? null : "log");
        return;
      }
      if (modal) return;
      if (k === "e" && !e.repeat) {
        e.preventDefault();
        interact(down);
        return;
      }
      if (keys[k]) {
        e.preventDefault();
        if (!e.repeat)
          command(g, {
            type: "move",
            dir: keys[k],
            pressed: down,
            source: e.code || k,
          });
      }
    };
    window.addEventListener("keydown", key);
    window.addEventListener("keyup", key);
    return () => {
      window.removeEventListener("keydown", key);
      window.removeEventListener("keyup", key);
    };
  }, [g, modal]);
  const obj = objective(g),
    home = atHome(g),
    panel = nearPanel(g) && !g.panelOpen,
    due = g.careAge >= CARE_INTERVAL;
  const depth = Math.max(0, Math.round(18 + (g.y - 11.45) * 3)),
    used = g.bag.copper + g.bag.crystal + g.bag.bloom;
  const note = g.ticks - g.noteTick < 360 ? g.note : "";
  const distance = obj.point
    ? Math.round(Math.hypot(obj.point.x - g.x, obj.point.y - g.y) * 3)
    : 0;
  const seedOK = /^\d{1,10}$/.test(seedText) && Number(seedText) <= 4294967295;
  const frame = () => {
    const last = lastSound.current;
    if (g.impact && last.impact !== g.impact.tick) {
      last.impact = g.impact.tick;
      sound.impact(g.impact.broken, g.impact.kind !== "earth");
    }
    if (g.noteTick !== last.note) {
      last.note = g.noteTick;
      if (/pulse|breath|bloom/i.test(g.note)) sound.pulse();
      else sound.item();
    }
    const mark = [
      Math.floor(g.x * 3),
      Math.floor(g.y * 3),
      g.panelOpen,
      g.noteTick,
      g.ticks - g.noteTick < 360,
      g.holdTicks,
      atHome(g),
      nearPanel(g),
      g.careAge >= CARE_INTERVAL,
      g.bag.bloom,
      g.bag.copper,
      g.bag.crystal,
    ].join(",");
    if (prev.current !== mark) {
      prev.current = mark;
      refresh();
    }
  };
  return (
    <main className={reduced ? "reduce-motion" : ""}>
      <header className="topbar" inert={!!modal}>
        <div className="brand">
          <span className="brand-stamp">
            <Icon name="brand" size={27} />
          </span>
          <Wordmark />
        </div>
        <span className="link-status">
          <i /> Sanctuary link
        </span>
        <div className="top-actions">
          <button
            className="log-btn"
            aria-label="Field log"
            onClick={() => change("log")}
          >
            <Icon name="log" />
            <span>Field log</span>
            <kbd>J</kbd>
          </button>
          <i className="divider" />
          <button
            className="square"
            title={audio ? "Mute audio" : "Enable audio"}
            aria-label={audio ? "Mute audio" : "Enable audio"}
            aria-pressed={audio}
            onClick={async () => {
              try {
                await sound.toggle();
              } catch {
                sound.enabled = false;
              }
              setAudio(sound.enabled);
            }}
          >
            <Icon name={audio ? "sound" : "mute"} />
          </button>
          <button
            className="square"
            title="Pause (Esc)"
            aria-label="Pause expedition"
            onClick={() => change("pause")}
          >
            <Icon name="pause" />
          </button>
        </div>
      </header>
      <section
        className="viewport"
        ref={sceneFocus}
        tabIndex={-1}
        aria-label="Expedition"
        inert={!!modal}
      >
        <GameCanvas
          game={g}
          paused={!!modal}
          onFrame={frame}
          reduced={reduced}
        />
        <div className="vignette" />
        <div className="sector">
          <div className="eyebrow">
            <i /> STRATUM 01
          </div>
          <h2>
            {g.panelOpen &&
            Math.hypot(g.x - g.world.annex.x - 3, g.y - g.world.annex.y) < 6
              ? "Medical Annex"
              : "The Quiet Hollow"}
          </h2>
          <div className="depth">
            <Icon name="depth" size={14} />
            <output aria-label="Depth">
              {String(depth).padStart(3, "0")}
            </output>{" "}
            m <span>/ DEPTH</span>
          </div>
        </div>
        <div className={"vitals " + (due ? "due" : "")}>
          <div className="micro">CARE SIGNAL</div>
          <div>
            <Icon name="pulse" size={20} />
            <strong>
              {due ? "Needs care" : g.treated ? "Steady" : "Resting"}
            </strong>
          </div>
        </div>
        <div className="home-tag">
          <span>✚</span> SANCTUARY
        </div>
        {!modal && (home || panel) && (
          <button
            className={"interact " + (panel ? "sealed" : "")}
            aria-label={
              home ? "Open sanctuary console" : "Hold to open annex panel"
            }
            onClick={() => {
              if (home) change("base");
            }}
            onPointerDown={(e) => {
              if (panel) {
                e.currentTarget.setPointerCapture(e.pointerId);
                interact(true);
              }
            }}
            onPointerUp={() => {
              if (panel) interact(false);
            }}
            onPointerCancel={() => interact(false)}
            onLostPointerCapture={() => {
              if (panel) interact(false);
            }}
            onKeyDown={(e) => {
              if (panel && (e.key === " " || e.key === "Enter")) {
                e.preventDefault();
                interact(true);
              }
            }}
            onKeyUp={(e) => {
              if (panel && (e.key === " " || e.key === "Enter"))
                interact(false);
            }}
          >
            <kbd>E</kbd>
            {home
              ? "Console"
              : g.holdTicks
                ? "Opening " +
                  Math.round((g.holdTicks / OPEN_TICKS) * 100) +
                  "%"
                : "Hold · Unseal"}
          </button>
        )}
        <div className="objective">
          <span className="objective-icon">
            <Icon name="target" size={24} />
          </span>
          <div>
            <div className="micro">
              {g.revealed ? "CARE CYCLE COMPLETE" : "CURRENT OBJECTIVE"}
            </div>
            <strong>{obj.name}</strong>
            <span className="objective-detail">{obj.detail}</span>
          </div>
          {obj.point && (
            <div
              className="bearing"
              aria-label={"Objective " + distance + " meters away"}
            >
              <span
                style={{
                  transform:
                    "rotate(" +
                    Math.atan2(obj.point.x - g.x, g.y - obj.point.y) +
                    "rad)",
                }}
              >
                <Icon name="compass" size={15} />
              </span>
              {distance}m
            </div>
          )}
        </div>
        <Survey g={g} />
        <div className="toast" role="status">
          {!modal && note && <span>{note}</span>}
        </div>
        {!modal && (
          <TouchControls
            move={(dir, pressed, source) =>
              command(g, { type: "move", dir, pressed, source })
            }
          />
        )}
      </section>
      <footer inert={!!modal}>
        <div className="pack-label">
          <Icon name="pack" size={24} />
          <div>
            <div className="micro">FIELD PACK</div>
            <b>
              {number(used)} <em>/ {number(g.capacity)}</em>
            </b>
          </div>
        </div>
        <div className="items">
          {(Object.keys(itemNames) as (keyof typeof itemNames)[]).map(
            (item) => (
              <div
                className="item"
                key={item}
                title={itemNames[item] + " · " + g.bag[item]}
              >
                <Icon name={item} size={26} />
                <span>{itemNames[item]}</span>
                <b>{g.bag[item]}</b>
              </div>
            ),
          )}
        </div>
        <div className="control-legend">
          <span>
            <kbd>W A S D</kbd> Float
          </span>
          <span className="mine-hint">Hold into rock to mine</span>
          <span>
            <kbd>E</kbd> Interact
          </span>
        </div>
      </footer>
      {modal && (
        <div className="scrim" ref={overlay}>
          {modal === "base" ? (
            <BasePanel g={g} close={() => change(null)} refresh={refresh} />
          ) : (
            <section
              className="dialog"
              role="dialog"
              aria-modal="true"
              aria-label={modal === "log" ? "Field log" : "Expedition paused"}
            >
              <div className="dialog-top">
                <small>
                  {modal === "log" ? "ANDROID MEMORY" : "FIELD SYSTEM"}
                </small>
                <button
                  className="square"
                  aria-label="Close menu"
                  onClick={() => change(null)}
                >
                  <Icon name="close" size={14} />
                </button>
              </div>
              {modal === "log" ? (
                <>
                  <h2>Field log</h2>
                  <div className="log-entry">
                    <small>CURRENT OBJECTIVE</small>
                    <h3>{obj.name}</h3>
                    <p>{obj.detail}</p>
                  </div>
                  <p>
                    Float with WASD, the arrow keys, or the direction pad. Keep
                    moving into rock to mine. Touch exposed minerals and
                    specimens to collect them.
                  </p>
                  <div className="log-entry">
                    <small>SANCTUARY</small>
                    <p>
                      The curtain is drawn. The human rests within reach of the
                      console. Return here to research, treat, or extend your
                      pack.
                    </p>
                  </div>
                  {g.bag.bloom > 0 && (
                    <div className="log-entry">
                      <small>LUMEN BLOOM</small>
                      <p>
                        A living violet flower. Its petals hum in short phrases.
                      </p>
                    </div>
                  )}
                  {g.panelOpen && (
                    <div className="log-entry">
                      <small>MEDICAL ANNEX</small>
                      <p>
                        Roots lace through the old respirator. Three pulses,
                        then a rest.
                      </p>
                    </div>
                  )}
                  {g.revealed && (
                    <div className="log-entry">
                      <small>CARE RESPONSE</small>
                      <p>
                        The human’s breathing repeats the annex rhythm. The
                        bloom answers.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <h2>Expedition paused</h2>
                  <p>The hollow can wait.</p>
                  <button className="primary" onClick={() => change(null)}>
                    Resume expedition
                  </button>
                  <div className="setting">
                    <label htmlFor="motion">Reduced motion</label>
                    <input
                      id="motion"
                      type="checkbox"
                      checked={reduced}
                      onChange={(e) => setReduced(e.target.checked)}
                    />
                  </div>
                  <div className="restart">
                    <label htmlFor="seed">World seed</label>
                    <input
                      id="seed"
                      value={seedText}
                      inputMode="numeric"
                      onChange={(e) => setSeedText(e.target.value)}
                    />
                    <p>Restarting clears this expedition’s progress.</p>
                    <button
                      disabled={!seedOK}
                      onClick={() => {
                        change(null);
                        setGame(createGame(Number(seedText)));
                        lastSound.current = { impact: -1, note: -1000 };
                        prev.current = "";
                      }}
                    >
                      Restart expedition
                    </button>
                  </div>
                </>
              )}
            </section>
          )}
        </div>
      )}
    </main>
  );
}

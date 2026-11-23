import { useEffect, useRef, useState } from "react";
import {
  command,
  createGame,
  drainEvents,
  type Direction,
  type Game as GameState,
  type GameEvent,
} from "../game/simulation";
import { prompt } from "../game/interact";
import { uniqueDeaths } from "../game/death";
import { BOARD } from "../game/data/deaths";
import type { LastDeath } from "../game/state";
import { Sound } from "../game/sound";
import { isDesktop, readDevice, rememberOverride } from "../platform/device";
import { DesktopOnly } from "./DesktopOnly";
import { GameCanvas } from "./GameCanvas";
import { Icon } from "./Icon";
import { DeathCard } from "./DeathCard";
import { DeathBoard } from "./DeathBoard";
import { erase, load, save, type Store } from "../game/save";
import { PAPER } from "../game/twist";
import { NEIGHBOURS } from "../game/data/neighbours";
import { T, view } from "../rendering/drawWorld";
import { centerX } from "../game/physics";

type Bubble = { key: number; who: string; text: string; until: number };
const BUBBLE_MS = 3800;

const pad = (n: number) => String(n).padStart(3, "0");
const moveKeys: Record<string, Direction> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "up",
  ArrowDown: "down",
  KeyA: "left",
  KeyD: "right",
  KeyW: "up",
  KeyS: "down",
};
const jumpKeys = new Set(["Space", "KeyK"]);
const grabKeys = new Set(["ShiftLeft", "ShiftRight", "KeyJ"]);
const CARD_MS = 4800;

export function App() {
  const [desktop, setDesktop] = useState(() => isDesktop(readDevice()));
  useEffect(() => {
    const update = () => setDesktop(isDesktop(readDevice()));
    const queries = ["(pointer: coarse)", "(hover: hover)"].map((q) => matchMedia(q));
    window.addEventListener("resize", update);
    queries.forEach((q) => q.addEventListener("change", update));
    return () => {
      window.removeEventListener("resize", update);
      queries.forEach((q) => q.removeEventListener("change", update));
    };
  }, []);
  if (!desktop)
    return (
      <DesktopOnly
        onOverride={() => {
          rememberOverride();
          setDesktop(true);
        }}
      />
    );
  return <Game />;
}

type Modal = "pause" | "board" | "paper" | "restart" | null;

/** Local storage, or null where the browser blocks it. */
function storage(): Store | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function Game() {
  const [g, setG] = useState<GameState>(() => load(storage()) ?? createGame()),
    [dark, setDark] = useState<{ who: string; text: string }[] | null>(null),
    [modal, setModal] = useState<Modal>(null),
    [sound] = useState(() => new Sound()),
    [audio, setAudio] = useState(false),
    [card, setCard] = useState<LastDeath | null>(null),
    [hint, setHint] = useState<string | null>(null),
    [bubbles, setBubbles] = useState<Bubble[]>([]),
    [, setRevision] = useState(0),
    [reduced, setReduced] = useState(() => matchMedia("(prefers-reduced-motion: reduce)").matches);
  const dialog = useRef<HTMLDivElement>(null),
    returnFocus = useRef<HTMLElement | null>(null),
    cardTimer = useRef(0),
    bubbleKey = useRef(0),
    bubbleLayer = useRef<HTMLDivElement>(null);
  const paused = modal !== null;

  // Save on meaningful events (see handle), every few seconds, and on leaving.
  useEffect(() => {
    const persist = () => save(storage(), g);
    const id = window.setInterval(persist, 5000);
    const hide = () => {
      if (document.hidden) persist();
    };
    document.addEventListener("visibilitychange", hide);
    window.addEventListener("pagehide", persist);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", hide);
      window.removeEventListener("pagehide", persist);
    };
  }, [g]);

  // The street's ambient pigeons, when audio is on.
  useEffect(() => {
    const id = window.setInterval(() => {
      if (!paused && document.hasFocus()) sound.coo();
    }, 9000);
    return () => window.clearInterval(id);
  }, [sound, paused]);

  const startOver = () => {
    erase(storage());
    window.clearTimeout(cardTimer.current);
    setCard(null);
    setBubbles([]);
    setDark(null);
    setG(createGame());
    setModal(null);
  };

  const open = (next: Modal) => {
    if (next && !modal)
      returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    command(g, { type: "clear" });
    setModal(next);
  };

  useEffect(() => {
    if (modal) {
      dialog.current?.querySelector<HTMLElement>("button")?.focus({ preventScroll: true });
      return;
    }
    returnFocus.current?.focus({ preventScroll: true });
    returnFocus.current = null;
  }, [modal]);

  useEffect(() => {
    command(g, { type: "clear" });
    const key = (e: KeyboardEvent) => {
      const down = e.type === "keydown";
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Escape") {
        if (down && !e.repeat) {
          e.preventDefault();
          open(modal ? null : "pause");
        }
        return;
      }
      if (e.code === "Tab") {
        if (down && !e.repeat && (modal === null || modal === "board")) {
          e.preventDefault();
          open(modal ? null : "board");
        }
        return;
      }
      if (modal) return;
      const dir = moveKeys[e.code];
      if (dir) {
        e.preventDefault();
        if (!e.repeat) command(g, { type: "move", dir, pressed: down, source: e.code });
      } else if (jumpKeys.has(e.code)) {
        e.preventDefault();
        if (!e.repeat) command(g, { type: "jump", pressed: down });
      } else if (grabKeys.has(e.code)) {
        e.preventDefault();
        if (down && !e.repeat) command(g, { type: "grab" });
      } else if (e.code === "KeyE") {
        e.preventDefault();
        if (down && !e.repeat) command(g, { type: "interact" });
      }
    };
    window.addEventListener("keydown", key);
    window.addEventListener("keyup", key);
    return () => {
      window.removeEventListener("keydown", key);
      window.removeEventListener("keyup", key);
    };
  }, [g, modal]);

  useEffect(() => {
    const q = matchMedia("(prefers-reduced-motion: reduce)"),
      pref = () => setReduced(q.matches),
      active = () => {
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

  useEffect(() => () => window.clearTimeout(cardTimer.current), []);

  const handle = (e: GameEvent) => {
    switch (e.type) {
      case "death":
        save(storage(), g);
        if (e.cause === "laughing") sound.laugh();
        else sound.death(e.isNew);
        setCard(e);
        window.clearTimeout(cardTimer.current);
        cardTimer.current = window.setTimeout(() => setCard(null), CARD_MS);
        setRevision((n) => n + 1);
        return;
      case "respawn":
        sound.ding();
        setDark(null);
        save(storage(), g);
        return;
      case "twist":
        save(storage(), g);
        if (e.step === 2) setDark([]);
        if (e.step === 3) open("paper");
        setRevision((n) => n + 1);
        return;
      case "bonk":
        sound.bonk();
        return;
      case "jump":
        sound.jump();
        return;
      case "land":
        sound.land();
        return;
      case "grab":
        sound.grab();
        return;
      case "throw":
        sound.throw();
        return;
      case "tramBell":
        sound.bell();
        return;
      case "compactorWarn":
        sound.warn();
        return;
      case "compactorSlam":
      case "thud":
        sound.slam();
        return;
      case "interact":
        sound.bonk();
        return;
      case "openBoard":
        open("board");
        return;
      case "speech": {
        sound.speak();
        if (g.phase === "twist") {
          setDark((lines) => [...(lines ?? []), { who: e.who, text: e.text }]);
          return;
        }
        const until = performance.now() + BUBBLE_MS + e.text.length * 25;
        setBubbles((list) => [
          ...list.filter((b) => b.who !== e.who),
          { key: ++bubbleKey.current, who: e.who, text: e.text, until },
        ]);
        return;
      }
      default:
        return;
    }
  };

  const onFrame = () => {
    for (const e of drainEvents(g)) handle(e);
    const next = g.phase === "alive" ? prompt(g) : null;
    if (next !== hint) setHint(next);
    // Keep speech bubbles over whoever is talking.
    const now = performance.now();
    if (bubbles.some((b) => b.until < now)) setBubbles((list) => list.filter((b) => b.until >= now));
    for (const el of bubbleLayer.current?.children ?? []) {
      const who = (el as HTMLElement).dataset.who;
      const n = g.level.neighbours.find((n) => n.id === who);
      const p = g.player;
      const x = n ? n.x : centerX(p),
        y = n ? n.y - 1.7 : p.y - 0.4;
      (el as HTMLElement).style.left = (((x * T - view.camX) / view.w) * 100).toFixed(2) + "%";
      (el as HTMLElement).style.top = (((y * T - view.camY) / view.h) * 100).toFixed(2) + "%";
    }
  };

  const found = uniqueDeaths(g);
  return (
    <main className={reduced ? "reduce-motion" : ""}>
      <header className="topbar" inert={paused}>
        <h1 className="wordmark">
          Project <span>Beloved</span>
        </h1>
        <p className="status" aria-live="polite">
          <span>
            Attempts <b>{pad(g.attempts)}</b>
          </span>
          <span>
            Board <b>{found}/{BOARD.length}</b>
          </span>
          <span>
            Human <b>{g.board.laughing ? "provisionally" : "not yet"}</b>
          </span>
          {g.twist === 1 ? (
            <span className="warn">
              Replicator <b>feedstock low</b>
            </span>
          ) : null}
        </p>
        <div className="top-actions">
          <button className="board-btn" onClick={() => open("board")}>
            Death Board <kbd>Tab</kbd>
          </button>
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
          <button className="square" title="Pause (Esc)" aria-label="Pause" onClick={() => open("pause")}>
            <Icon name="pause" />
          </button>
        </div>
      </header>
      <section className="viewport" aria-label="The block" inert={paused}>
        <GameCanvas game={g} paused={paused} reduced={reduced} onFrame={onFrame} />
        {hint && !paused && !dark ? (
          <p className="prompt">
            <kbd>E</kbd> {hint}
          </p>
        ) : null}
        <div className="bubbles" ref={bubbleLayer} aria-live="polite">
          {bubbles.map((b) => (
            <p key={b.key} className={`bubble ${b.who}`} data-who={b.who}>
              <b>{b.who === "you" ? "You" : NEIGHBOURS[b.who as keyof typeof NEIGHBOURS].name}</b> {b.text}
            </p>
          ))}
        </div>
        {card ? <DeathCard death={card} /> : null}
        {dark ? (
          <div className="dark" role="status">
            {dark.map((l, i) => (
              <p key={i}>
                <b>{l.who === "you" ? "You" : NEIGHBOURS[l.who as keyof typeof NEIGHBOURS].name}</b> {l.text}
              </p>
            ))}
          </div>
        ) : null}
        <ul className="legend" aria-label="Controls">
          <li>
            <kbd>A</kbd>
            <kbd>D</kbd> Walk
          </li>
          <li>
            <kbd>Space</kbd> Jump
          </li>
          <li>
            <kbd>W</kbd>
            <kbd>S</kbd> Ladders
          </li>
          <li>
            <kbd>Shift</kbd> Grab, throw
          </li>
          <li>
            <kbd>E</kbd> Use
          </li>
          <li className="hint">Hold W to throw up, S to set down or drop below you</li>
        </ul>
        <p className="placeholder-tag">Placeholder art</p>
      </section>
      {modal ? (
        <div className="scrim" ref={dialog}>
          {modal === "board" ? (
            <DeathBoard g={g} close={() => open(null)} />
          ) : modal === "paper" ? (
            <div className="dialog paper-reveal" role="dialog" aria-modal="true" aria-labelledby="paper-title">
              <p className="eyebrow">Pinned to the Death Board by Rook</p>
              <h2 id="paper-title" className="paper">
                <span className="half">{PAPER.left}</span> <span className="half rook-half">{PAPER.right}</span>
              </h2>
              <p>
                It's from Rook's school poster, <i>Things Only Humans Do</i>. Every one of your deaths had the
                whole block dying laughing. And now, for the first time, so are you.
              </p>
              <button className="text-button" onClick={() => open(null)}>
                Laugh
              </button>
            </div>
          ) : modal === "restart" ? (
            <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="restart-title">
              <h2 id="restart-title">Start over?</h2>
              <p>
                This erases the Death Board, the attempt count and every old body. Bas will be thrilled. It can't be
                undone.
              </p>
              <div className="row">
                <button className="text-button" onClick={() => open("pause")}>
                  Keep my bodies
                </button>
                <button className="text-button danger" onClick={startOver}>
                  Erase and start over
                </button>
              </div>
            </div>
          ) : (
            <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="pause-title">
              <div className="dialog-head">
                <h2 id="pause-title">Paused</h2>
                <button className="square" aria-label="Close pause menu" onClick={() => open(null)}>
                  <Icon name="close" />
                </button>
              </div>
              <p>The block holds its breath. The pigeons do not, but they are polite about it.</p>
              <p className="micro">
                Motion: {reduced ? "reduced (system setting)" : "full"} · Progress saves in this browser.
              </p>
              <div className="row">
                <button className="text-button" onClick={() => open(null)}>
                  Resume
                </button>
                <button className="text-button quiet" onClick={() => setModal("restart")}>
                  Start over…
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </main>
  );
}

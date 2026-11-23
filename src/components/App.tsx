import { useEffect, useRef, useState } from "react";
import { command, createGame, type Direction } from "../game/simulation";
import { Sound } from "../game/sound";
import { isDesktop, readDevice, rememberOverride } from "../platform/device";
import { DesktopOnly } from "./DesktopOnly";
import { GameCanvas } from "./GameCanvas";
import { Icon } from "./Icon";

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

export function App() {
  const [desktop, setDesktop] = useState(() => isDesktop(readDevice()));
  useEffect(() => {
    const update = () => setDesktop(isDesktop(readDevice()));
    const queries = ["(pointer: coarse)", "(hover: hover)"].map((q) =>
      matchMedia(q),
    );
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

function Game() {
  const [g] = useState(createGame),
    [paused, setPaused] = useState(false),
    [sound] = useState(() => new Sound()),
    [audio, setAudio] = useState(false),
    [reduced, setReduced] = useState(
      () => matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  const dialog = useRef<HTMLDivElement>(null),
    returnFocus = useRef<HTMLElement | null>(null);

  const pause = (next: boolean) => {
    if (next)
      returnFocus.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
    setPaused(next);
  };

  useEffect(() => {
    if (paused) {
      dialog.current?.querySelector("button")?.focus({ preventScroll: true });
      return;
    }
    returnFocus.current?.focus({ preventScroll: true });
    returnFocus.current = null;
  }, [paused]);

  useEffect(() => {
    command(g, { type: "clear" });
    const key = (e: KeyboardEvent) => {
      const down = e.type === "keydown";
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Escape") {
        if (down && !e.repeat) {
          e.preventDefault();
          pause(!paused);
        }
        return;
      }
      if (paused) return;
      const dir = moveKeys[e.code];
      if (dir) {
        e.preventDefault();
        if (!e.repeat)
          command(g, { type: "move", dir, pressed: down, source: e.code });
      } else if (jumpKeys.has(e.code)) {
        e.preventDefault();
        if (!e.repeat) command(g, { type: "jump", pressed: down });
      } else if (grabKeys.has(e.code)) {
        e.preventDefault();
        if (down && !e.repeat) command(g, { type: "grab" });
      }
    };
    window.addEventListener("keydown", key);
    window.addEventListener("keyup", key);
    return () => {
      window.removeEventListener("keydown", key);
      window.removeEventListener("keyup", key);
    };
  }, [g, paused]);

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
            Human <b>not yet</b>
          </span>
        </p>
        <div className="top-actions">
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
            aria-label="Pause"
            onClick={() => pause(true)}
          >
            <Icon name="pause" />
          </button>
        </div>
      </header>
      <section className="viewport" aria-label="The block" inert={paused}>
        <GameCanvas game={g} paused={paused} reduced={reduced} />
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
            <kbd>S</kbd> Ladders, drop down
          </li>
          <li>
            <kbd>Shift</kbd> Grab, throw
          </li>
          <li className="hint">Hold W to throw up, S to set down</li>
        </ul>
        <p className="placeholder-tag">Placeholder art</p>
      </section>
      {paused && (
        <div className="scrim">
          <div
            className="dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pause-title"
            ref={dialog}
          >
            <div className="dialog-head">
              <h2 id="pause-title">Paused</h2>
              <button
                className="square"
                aria-label="Close pause menu"
                onClick={() => pause(false)}
              >
                <Icon name="close" />
              </button>
            </div>
            <p>
              The block holds its breath. The pigeons do not, but they are
              polite about it.
            </p>
            <p className="micro">
              Motion: {reduced ? "reduced (system setting)" : "full"}
            </p>
            <button className="text-button" onClick={() => pause(false)}>
              Resume
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

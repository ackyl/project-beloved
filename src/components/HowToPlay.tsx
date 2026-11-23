import { useEffect, useRef, useState } from "react";

export function HowToPlay({ play, skip }: { play: () => void; skip: () => void }) {
  const [showControls, setShowControls] = useState(false);
  const title = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    title.current?.focus({ preventScroll: true });
  }, [showControls]);

  return (
    <section className="dialog guide" role="dialog" aria-modal="true" aria-labelledby="guide-title">
      <header className="guide-header">
        <div>
          <p className="eyebrow">Project Beloved</p>
          <h2 id="guide-title" ref={title} tabIndex={-1} data-dialog-focus>
            {showControls ? "How to Play" : "The Premise"}
          </h2>
        </div>
        <button className="guide-secondary" type="button" onClick={skip}>Skip</button>
      </header>
      {showControls ? (
        <div className="guide-content" key="controls" role="region" aria-label="Controls" tabIndex={0}>
          <p>
            Discover 20 ways to die around the block. Stack your old bodies to reach new places,
            and ask Rook if you need a hint.
          </p>
          <dl className="guide-controls">
            <div><dt><kbd>←</kbd> <kbd>→</kbd></dt><dd>Walk</dd></div>
            <div><dt><kbd>↑</kbd></dt><dd>Jump or climb a nearby ladder</dd></div>
            <div><dt><kbd>↓</kbd></dt><dd>Climb down or drop through a platform</dd></div>
            <div>
              <dt><kbd className="guide-key">E</kbd><span className="guide-touch">Use</span></dt>
              <dd>Talk to neighbours or use objects</dd>
            </div>
            <div>
              <dt><kbd className="guide-key">Q</kbd><span className="guide-touch">Grab / Throw</span></dt>
              <dd>Pick up an object or throw what you’re carrying</dd>
            </div>
          </dl>
          <p className="guide-tip">
            Hold ← or → with ↑ to jump across a gap. Hold ↑ while throwing to aim high, or ↓ to set the object down.
          </p>
          <p className="guide-tip">
            Open the Death Board<span className="guide-key"> with <kbd>Tab</kbd></span> to track discoveries.
          </p>
        </div>
      ) : (
        <div className="guide-content" key="premise" role="region" aria-label="Premise" tabIndex={0}>
          <p>
            An android wants to understand what it means to be human. It studies their habits, copies their behavior,
            and eventually arrives at one unavoidable conclusion: humans die. Fortunately, it has an unlimited supply
            of replacement bodies and absolutely no sense of self-preservation.
          </p>
        </div>
      )}
      <footer className="guide-footer">
        {showControls && (
          <button className="guide-secondary" type="button" onClick={() => setShowControls(false)}>Back</button>
        )}
        <button
          className="text-button guide-continue"
          type="button"
          onClick={showControls ? play : () => setShowControls(true)}
        >
          {showControls ? "Play" : "Next"}
        </button>
      </footer>
    </section>
  );
}

export function DesktopOnly({ onOverride }: { onOverride: () => void }) {
  return (
    <main className="desktop-only">
      <div className="desktop-card" role="dialog" aria-labelledby="desktop-title">
        <p className="eyebrow">Project Beloved</p>
        <h1 id="desktop-title">This is a desktop experience</h1>
        <p>
          The android needs a keyboard to walk, jump, grab things and make
          questionable decisions. Please visit on a computer with a keyboard
          and a window at least 720 pixels wide.
        </p>
        <button className="text-button" onClick={onOverride}>
          Try anyway
        </button>
      </div>
    </main>
  );
}

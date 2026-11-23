export type Glyph = "sound" | "mute" | "pause" | "close";

const paths: Record<Glyph, string> = {
  sound: "M2 6h3l4-3v10l-4-3H2zM11 5.5c1.3 1.4 1.3 3.6 0 5M13 3c2.6 2.8 2.6 7.2 0 10",
  mute: "M1 6h3l4-3v10l-4-3H1zM11 6l4 4M15 6l-4 4",
  pause: "M5 3v10M11 3v10",
  close: "M3 3l10 10M13 3L3 13",
};

export function Icon({ name, size = 18 }: { name: Glyph; size?: number }) {
  return (
    <svg
      className="icon"
      viewBox="0 0 16 16"
      width={size}
      height={size}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth={name === "pause" ? 2.6 : 1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[name]} />
    </svg>
  );
}

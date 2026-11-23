export const S = 20;
export type Brush = CanvasRenderingContext2D;
export type Rect = (
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
) => void;
export function brush(c: Brush): Rect {
  return (x, y, w, h, col) => {
    c.fillStyle = col;
    c.fillRect(Math.round(x), Math.round(y), Math.ceil(w), Math.ceil(h));
  };
}
export function poly(c: Brush, col: string, points: number[]) {
  c.fillStyle = col;
  c.beginPath();
  c.moveTo(Math.round(points[0]), Math.round(points[1]));
  for (let i = 2; i < points.length; i += 2)
    c.lineTo(Math.round(points[i]), Math.round(points[i + 1]));
  c.closePath();
  c.fill();
}
export function glow(
  c: Brush,
  x: number,
  y: number,
  r: number,
  rgb: string,
  strength: number,
) {
  const grad = c.createRadialGradient(x, y, 0, x, y, r);
  grad.addColorStop(0, "rgba(" + rgb + "," + strength + ")");
  grad.addColorStop(0.46, "rgba(" + rgb + "," + strength * 0.33 + ")");
  grad.addColorStop(1, "rgba(" + rgb + ",0)");
  c.fillStyle = grad;
  c.fillRect(x - r, y - r, r * 2, r * 2);
}
export function sprite(
  r: Rect,
  x: number,
  y: number,
  rows: string[],
  colors: Record<string, string>,
  scale = 1,
) {
  for (let j = 0; j < rows.length; j++)
    for (let i = 0; i < rows[j].length; i++) {
      const color = colors[rows[j][i]];
      if (color) r(x + i * scale, y + j * scale, scale, scale, color);
    }
}
export const iconColors: Record<string, string> = {
  k: "#14252a",
  c: "#66b9c5",
  l: "#c7fff1",
  a: "#77dbc0",
  g: "#338c79",
  b: "#275b58",
  p: "#ac87d1",
  v: "#785e9b",
  h: "#e2c4ee",
  o: "#c37f58",
  s: "#815449",
  t: "#f2bd87",
  d: "#453c43",
  w: "#efe4c7",
  y: "#e3ad67",
};
export const androidArt = [
  ".....kk.......kk....",
  ".....kyk.....kyk....",
  ".....kwwwkkkwwwk....",
  "....kwwwwwwwwwwkk...",
  "...kwwyyywwwwwyyyk..",
  "...kwyyyywwwwwyyyk..",
  "..skwwwkkkkkkkkwyk..",
  "..skwwkclclcccwkysk.",
  "..skwwkccllccckwyyk.",
  "..sskkkbbbbbbkksssk.",
  "..sookyywwyyykk....",
  "..stokkoywwyykkw...",
  "..sookoyywwyskyyk..",
  "..sskkssyyyykkoyk..",
  "....kkoyyyyyykook..",
  "....kyskskksskkk...",
  "....kwwk..kwwk.....",
  "....kssk..kssk.....",
];
export type Pose = "idle" | "walk" | "air" | "climb";

/** Draws the android with its feet centred on (x, feetY). The sprite is 20 × 18 px. */
export function android(
  c: Brush,
  x: number,
  feetY: number,
  left: boolean,
  t: number,
  pose: Pose,
  reduced: boolean,
) {
  c.save();
  c.translate(Math.round(x), Math.round(feetY));
  c.scale(left ? -1 : 1, 1);
  const r = brush(c),
    frame = reduced && pose !== "walk" ? 0 : Math.floor(t / 6) % 4;
  let liftL = 0,
    liftR = 0,
    bob = 0;
  if (pose === "walk") {
    liftL = frame === 1 ? 1 : 0;
    liftR = frame === 3 ? 1 : 0;
    bob = frame % 2;
  } else if (pose === "air") liftL = liftR = 1;
  else if (pose === "climb") {
    liftL = frame < 2 ? 2 : 0;
    liftR = frame < 2 ? 0 : 2;
  } else if (!reduced) bob = Math.floor(t / 40) % 2;
  sprite(r, -10, -18 - bob, androidArt.slice(0, 16), iconColors);
  const legs = androidArt.slice(16);
  sprite(r, -10, -2 - liftL, legs.map((row) => row.slice(0, 9)), iconColors);
  sprite(r, -1, -2 - liftR, legs.map((row) => row.slice(9)), iconColors);
  c.restore();
}

// Corpse sprites: powered-off visors (d), stiff poses.
export const flatArt = [
  "....................",
  "..............kk.kk.",
  ".........kkkkkkykkyk",
  "..kkkkkkkwwwwwwwwwwk",
  "kkssyyyykwwykkkkkkwk",
  "kwwyyyyykwwkddddddkk",
  "kwwyyyykkwwykkkkkkwk",
  "kkssyyyykwwwwwwwwwwk",
  "..kkkkkkkkkkkkkkkkk.",
  "....................",
];
export const cubeArt = [
  "kkkkkkkkkk",
  "kwwkkkkwwk",
  "kwkddddkwk",
  "kwkkkkkkwk",
  "kyyyyyyyyk",
  "kyoyyyysyk",
  "kyyyyyyyyk",
  "ksyyyyyysk",
  "kssssssssk",
  "kkkkkkkkkk",
];
const offVisor = { c: "#2a2724", l: "#3b3632", d: "#2a2724" };
const tints: Record<string, Record<string, string>> = {
  none: {},
  fried: { w: "#d59a55", y: "#a8652f", s: "#6b3b1f", o: "#7a4321", t: "#c98a4a" },
  wet: { w: "#c6dde6", y: "#93b9cc", s: "#5f7f93", o: "#7c9aac" },
  zapped: { w: "#6a645d", y: "#4a4540", s: "#2f2b28", o: "#3a3531", t: "#5a5550" },
  melted: { w: "#f3c08a", y: "#e5964f", s: "#a8582c" },
  rusty: { w: "#c0794f", y: "#94512f", s: "#6e3a26", o: "#8a4728" },
  leafy: { w: "#b9d6a3", y: "#7fa866", s: "#4f7444", o: "#5f8a4c" },
};
export const corpseColors = (tint = "none") => ({ ...iconColors, ...offVisor, ...(tints[tint] ?? {}) });

export function corpse(c: Brush, x: number, feetY: number, pose: string, tint: string | undefined, facingLeft: boolean) {
  const colors = corpseColors(tint);
  c.save();
  c.translate(Math.round(x), Math.round(feetY));
  if (facingLeft) c.scale(-1, 1);
  const r = brush(c);
  if (pose === "flat") sprite(r, -10, -10, flatArt, colors);
  else if (pose === "cube") sprite(r, -5, -10, cubeArt, colors);
  else if (pose === "upside") {
    c.scale(1, -1);
    sprite(r, -10, 0, androidArt, colors);
  } else sprite(r, -10, -18, androidArt, colors);
  if (tint === "leafy") {
    r(-2, pose === "flat" ? -12 : -21, 2, 3, "#6f9a5a");
    r(0, pose === "flat" ? -13 : -22, 3, 2, "#8fbf6a");
  }
  c.restore();
}

/** The android drawn only from the feet up to `fraction` of its height: the replicator printing it. */
export function printing(c: Brush, x: number, feetY: number, fraction: number) {
  const h = Math.round(18 * Math.max(0, Math.min(1, fraction)));
  c.save();
  c.beginPath();
  c.rect(Math.round(x) - 11, Math.round(feetY) - h, 22, h);
  c.clip();
  const r = brush(c);
  sprite(r, Math.round(x) - 10, Math.round(feetY) - 18, androidArt, iconColors);
  c.restore();
  brush(c)(Math.round(x) - 9, Math.round(feetY) - h - 1, 18, 1, "#fff4d6");
}

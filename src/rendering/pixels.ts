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
const androidColors: Record<string, string> = {
  k: "#101626", // outline
  d: "#222b43", // joints and faceplate
  s: "#485d78", // shaded alloy
  y: "#8ba7b4", // brushed alloy
  w: "#e5f1ea", // ceramic shell
  o: "#df884d", // hazard orange
  t: "#ffca78",
  c: "#429ba9", // lens housing
  l: "#a8fff2", // powered optics
};

const helmet = [
  "..kkkkkkkk...",
  ".kwwwwyyyyk..",
  "kwwywwyyyyyk.",
  "koywdddddddk.",
  "ktywddlclddk.",
  "koywdkllllck.",
  ".ksyydddddk..",
  "..kkssyykk...",
];
const torso = [
  ".kddkddk.",
  "kywwwwsyk",
  "kwwowwysk",
  "kwyooyssk",
  ".ksyyssk.",
  ".kddkddk.",
];
const nearArm = [
  ".kk.",
  "kwwk",
  "kyyk",
  ".kd.",
  "kyyk",
  "kssk",
  ".kk.",
];
const farArm = [
  ".kk.",
  "ksyk",
  "kss.",
  ".kd.",
  ".ksk",
  ".kk.",
];
const nearLeg = [
  "kywk.",
  "ksyk.",
  ".kdk.",
  ".kwk.",
  ".kyyk",
  ".kkkk",
];
const farLeg = [
  "kssk.",
  "kddk.",
  ".kdk.",
  ".ksk.",
  ".kssk",
  ".kkkk",
];
const ANDROID_HEIGHT = 20;

export type Pose = "idle" | "walk" | "air" | "climb";

function androidFrame(r: Rect, colors: Record<string, string>, pose: Pose, frame: number) {
  const stride = pose === "walk" ? [0, 2, 0, -2][frame] : 0;
  const reach = pose === "climb" ? (frame < 2 ? 2 : -2) : 0;
  const tuck = pose === "air" ? 1 : 0;
  const bob = Math.abs(stride) ? 1 : 0;
  sprite(r, 0 - stride + tuck, -6 - Math.max(0, stride, -reach), farLeg, colors);
  sprite(r, -5 + stride, -6 - Math.max(stride < 0 ? 1 : 0, reach, tuck), nearLeg, colors);
  sprite(r, 4 + Math.sign(stride), -11 - Math.max(0, reach) - tuck, farArm, colors);
  sprite(r, -4, -13 - bob, torso, colors);
  sprite(r, -8 - Math.sign(stride), -12 - Math.max(0, -reach) - tuck, nearArm, colors);
  sprite(r, -6, -ANDROID_HEIGHT - bob, helmet, colors);
}

/** Feet stay anchored to the player box as limbs move through each pose. */
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
  if (left) c.scale(-1, 1);
  androidFrame(brush(c), androidColors, pose, reduced && pose !== "walk" ? 0 : Math.floor(t / 6) % 4);
  c.restore();
}

const flatArt = [
  ".............kkkkk..",
  ".....kkkk...kwwyyyk.",
  "..kkkwwowkkkwwyddddk",
  ".kssyyyooyskoywddddk",
  "kyydkywwsskksyyddddk",
  "kskdkksskkk.kssyyyk.",
  "kkkkkkkk.....kkkkk..",
];
const cubeArt = [
  "kkkkkkkkkk",
  "kwwyyyysyk",
  "kwkdddddok",
  "kwkdddddok",
  "kyssssssyk",
  "kyowyyssyk",
  "kyssyyssyk",
  "ksyssysykk",
  "kksssskkk.",
  "kkkkkkkk..",
];
const offVisor = { c: "#364458", l: "#364458" };
const tints: Record<string, Record<string, string>> = {
  none: {},
  fried: { w: "#d59a55", y: "#a8652f", s: "#6b3b1f", o: "#7a4321", t: "#c98a4a" },
  wet: { w: "#c6dde6", y: "#93b9cc", s: "#5f7f93", o: "#7c9aac" },
  zapped: { w: "#6a645d", y: "#4a4540", s: "#2f2b28", o: "#3a3531", t: "#5a5550" },
  melted: { w: "#f3c08a", y: "#e5964f", s: "#a8582c" },
  rusty: { w: "#c0794f", y: "#94512f", s: "#6e3a26", o: "#8a4728" },
  leafy: { w: "#b9d6a3", y: "#7fa866", s: "#4f7444", o: "#5f8a4c" },
};
const corpseColors = (tint = "none") => ({ ...androidColors, ...offVisor, ...(tints[tint] ?? {}) });

export function corpse(c: Brush, x: number, feetY: number, pose: string, tint: string | undefined, facingLeft: boolean) {
  const colors = corpseColors(tint);
  c.save();
  c.translate(Math.round(x), Math.round(feetY));
  if (facingLeft) c.scale(-1, 1);
  const r = brush(c);
  if (pose === "flat") sprite(r, -10, -7, flatArt, colors);
  else if (pose === "cube") sprite(r, -5, -10, cubeArt, colors);
  else if (pose === "upside") {
    c.scale(1, -1);
    c.translate(0, ANDROID_HEIGHT);
    androidFrame(r, colors, "idle", 0);
  } else androidFrame(r, colors, "idle", 0);
  if (tint === "leafy") {
    r(-2, pose === "flat" ? -12 : -21, 2, 3, "#6f9a5a");
    r(0, pose === "flat" ? -13 : -22, 3, 2, "#8fbf6a");
  }
  c.restore();
}

/** The android drawn only from the feet up to `fraction` of its height: the replicator printing it. */
export function printing(c: Brush, x: number, feetY: number, fraction: number) {
  const h = Math.round(ANDROID_HEIGHT * Math.max(0, Math.min(1, fraction)));
  c.save();
  c.beginPath();
  c.rect(Math.round(x) - 11, Math.round(feetY) - h, 22, h);
  c.clip();
  android(c, x, feetY, false, 0, "idle", true);
  c.restore();
  brush(c)(Math.round(x) - 9, Math.round(feetY) - h - 1, 18, 1, "#a8fff2");
}

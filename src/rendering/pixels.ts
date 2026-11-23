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

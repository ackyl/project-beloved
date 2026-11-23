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
export const itemArt = {
  copper: [
    "............",
    "......oo....",
    ".....ottoo..",
    "...soottoo..",
    "..ootossoo..",
    "..ottoooss..",
    ".sotoootoss.",
    ".soooootoss.",
    "..ssossoss..",
    "...sssss....",
  ],
  crystal: [
    ".......cc...",
    "......clc...",
    "...c..clc...",
    "..clc.clc...",
    "..clccccc.c.",
    "..cccccc.cl.",
    "...cbccccc..",
    "...bbccbc...",
    "....bbbbb...",
    "............",
  ],
  bloom: [
    "......hh....",
    "...phhph....",
    "..hhphvp.hh.",
    "..vppvvphp..",
    "....pvpvv...",
    ".aa..vg..aa.",
    "..gaaagaga..",
    "...ggaggg...",
    ".....gg.....",
    "....gbgg....",
  ],
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
  ".....aa....aa......",
];
export function android(
  c: Brush,
  x: number,
  y: number,
  left: boolean,
  t: number,
  reduced: boolean,
) {
  c.save();
  c.translate(
    Math.round(x),
    Math.round(y + (reduced ? 0 : Math.sin(t / 17) * 0.8)),
  );
  c.scale(left ? -1 : 1, 1);
  const r = brush(c),
    n = reduced ? 2 : 2 + Math.round(2 * Math.sin(t / 4));
  r(-5, 8, 2, 3 + n, "#448f91");
  r(3, 8, 2, 2 + n, "#4b9b9e");
  r(-5, 8, 2, 2, "#d4faca");
  r(3, 8, 2, 2, "#d4faca");
  sprite(r, -10, -11, androidArt, iconColors);
  c.restore();
}

import { at, hardness, rng, surface, type World } from "../game/world";
import { S, brush, poly, glow, type Brush } from "./pixels";

const shale = new Image();
shale.src = "/art/shale.png";
let pattern: CanvasPattern | null = null;
function rockPattern(c: Brush) {
  if (pattern || !shale.complete || !shale.naturalWidth) return pattern;
  const stamp = document.createElement("canvas");
  stamp.width = 144;
  stamp.height = 144;
  const piece = document.createElement("canvas");
  piece.width = 160;
  piece.height = 160;
  const p = piece.getContext("2d")!;
  p.drawImage(shale, 0, 0, 160, 160);
  p.globalCompositeOperation = "destination-in";
  for (const [x, y] of [
    [160, 0],
    [0, 160],
  ]) {
    const fade = p.createLinearGradient(0, 0, x, y);
    fade.addColorStop(0, "#fff");
    fade.addColorStop(0.9, "#fff");
    fade.addColorStop(1, "transparent");
    p.fillStyle = fade;
    p.fillRect(0, 0, 160, 160);
  }
  const b = stamp.getContext("2d")!;
  for (const x of [0, -144])
    for (const y of [0, -144]) b.drawImage(piece, x, y);
  pattern = c.createPattern(stamp, "repeat");
  return pattern;
}
function shard(
  c: Brush,
  x: number,
  y: number,
  w: number,
  h: number,
  lean: number,
  purple: boolean,
) {
  const base = purple ? "#816599" : "#409f98",
    light = purple ? "#d5a9ed" : "#9eefd1",
    dark = purple ? "#514862" : "#2b6268";
  poly(c, dark, [
    x - w,
    y,
    x - w + lean,
    y - h + 3,
    x + lean,
    y - h,
    x + w + lean,
    y - h + 3,
    x + w,
    y,
  ]);
  poly(c, base, [
    x - w + 1,
    y - 1,
    x - w + lean,
    y - h + 3,
    x + lean,
    y - h + 1,
    x,
    y - 2,
  ]);
  poly(c, light, [
    x - w + lean,
    y - h + 3,
    x + lean,
    y - h,
    x + w + lean,
    y - h + 3,
    x + lean,
    y - h + 5,
  ]);
  brush(c)(x - w + lean, y - h + 4, 1, Math.max(1, h / 3), light);
}
function fungi(
  c: Brush,
  x: number,
  y: number,
  n: number,
  random: () => number,
) {
  const r = brush(c);
  for (let i = 0; i < n; i++) {
    const px = x + Math.floor(random() * 16),
      h = 3 + Math.floor(random() * 6),
      w = 2 + Math.floor(random() * 3);
    r(px, y - h, 1, h, "#8cbcb0");
    r(px - w, y - h, w * 2 + 1, 2, "#5b9b98");
    r(px - w + 1, y - h - 1, w * 2 - 1, 2, "#8acbc1");
    r(px - 1, y - h - 2, 2, 2, "#c0e8ce");
  }
}
function surfaceArt(c: Brush, w: World, x: number, y: number, seed: number) {
  if (at(w, x, y).kind === "empty" || at(w, x, y - 1).kind !== "empty") return;
  if (y === 12 && x >= 9 && x <= 16) return;
  const random = rng(seed + x * 31277 + y * 7727),
    r = brush(c),
    px = x * S,
    py = y * S;
  const lush = y <= surface(x) + 2,
    colors = lush
      ? ["#426959", "#669479", "#80a581", "#37594f"]
      : ["#3b5554", "#52736a", "#6d8c78", "#334c47"];
  for (let i = 0; i < S; i += 2) {
    const h = Math.floor(random() * 4);
    r(px + i, py - 1 - h, 2, 3 + h, colors[0]);
    r(px + i, py - 1 - h, 2, 1, colors[1]);
    if (random() > 0.52) r(px + i, py - h - 2, 1, 1, colors[2]);
    if (random() > 0.54) r(px + i, py + 1, 1, 3 + random() * 4, colors[3]);
  }
  if (!lush && random() < 0.55) return;
  if (y === surface(x) && (x === 26 || x === 5)) {
    glow(c, px + 10, py - 14, 37, "87,233,190", 0.25);
    for (const [dx, dy, width, lean] of [
      [2, 13, 3, -5],
      [7, 26, 4, -2],
      [12, 34, 5, 6],
      [14, 16, 3, 8],
      [17, 9, 3, 6],
    ])
      shard(c, px + dx, py - 1, width, dy, lean, false);
    return;
  }
  if ((x === 26 || x === 6 || x % 13 === 1) && y === surface(x)) {
    glow(c, px + 8, py - 8, 28, "109,219,190", 0.16);
    shard(c, px + 11, py, 4, 15, 3, false);
    shard(c, px + 6, py, 3, 10, -3, false);
    shard(c, px + 15, py, 2, 8, 4, false);
  } else if (x === 29 || x % 15 === 7) {
    glow(c, px + 8, py - 4, 21, "190,140,224", 0.11);
    shard(c, px + 8, py, 3, 11, 1, true);
    shard(c, px + 3, py, 2, 6, -2, true);
    shard(c, px + 14, py, 2, 8, 4, true);
  } else if (random() < 0.3) fungi(c, px, py - 1, 3, random);
  else if (random() < 0.65) {
    for (let n = 0; n < 6; n++) {
      const bx = px + random() * 18,
        bh = 3 + random() * 7,
        bend = random() * 8 - 4;
      poly(c, n % 2 ? "#487d68" : "#62927b", [
        bx,
        py,
        bx + bend,
        py - bh,
        bx + 2,
        py - 2,
      ]);
    }
  }
}
function rock(c: Brush, world: World, x: number, y: number, seed: number) {
  const cell = at(world, x, y);
  if (cell.kind === "empty") return;
  const r = brush(c),
    px = x * S,
    py = y * S,
    random = rng(
      seed + Math.imul(x + 1, 198491317) + Math.imul(y + 1, 6542989),
    );
  const dark = y > surface(x) + 2,
    base = dark ? "#18252a" : "#293b3b";
  r(px, py, S, S, base);
  const fill = rockPattern(c);
  if (fill) {
    c.fillStyle = fill;
    c.fillRect(px, py, S, S);
  }
  const tint =
    cell.kind === "earth" ? "rgba(108,81,52,.12)" : "rgba(25,63,67,.14)";
  r(px, py, S, S, tint);
  if (dark) r(px, py, S, S, "rgba(9,20,25,.19)");
  const crack = cell.kind === "stone" || cell.kind === "shell";
  if (crack) {
    const q = px + 3 + random() * 10;
    poly(c, "#17252a", [
      q,
      py + 4,
      q + 5,
      py + 7,
      q + 3,
      py + 11,
      q + 10,
      py + 13,
      q + 2,
      py + 12,
      q + 3,
      py + 8,
    ]);
  }
  if (cell.kind === "copper" || cell.kind === "crystal") {
    const warm = cell.kind === "copper",
      n = 3 + Math.floor(random() * 3);
    const sx = px + 3 + random() * 4,
      sy = py + 12 + random() * 2;
    for (let i = 0; i < n; i++) {
      const xx = sx + i * 2 + random() * 2,
        yy = sy - i * (warm ? 0.5 : 1.8) + random() * (warm ? 6 : 3);
      r(xx - 1, yy - 1, 4, 3, warm ? "#55453c" : "#33454e");
      r(xx, yy - 2, 3, 3, warm ? "#94694f" : "#61949b");
      r(xx, yy - 2, 2, 1, warm ? "#c89567" : "#b3ddd1");
    }
  }
  if (at(world, x, y - 1).kind === "empty") {
    r(px, py, S, 2, "#45594e");
    r(px, py + 2, 6 + random() * 6, 1, "#374a43");
  }
  if (at(world, x - 1, y).kind === "empty") {
    r(px, py, 2, S, "#43564f");
    r(px + 2, py + 4, 1, 9, "#374742");
  }
  if (at(world, x + 1, y).kind === "empty") r(px + S - 2, py, 2, S, "#354a46");
  if (at(world, x, y + 1).kind === "empty") {
    r(px, py + S - 3, S, 3, "#101d22");
    r(px + 2, py + S, 4, 2, "#18282b");
  }
  if (cell.hp < hardness[cell.kind]) {
    poly(c, "#0c181c", [
      px + 2,
      py + 2,
      px + 11,
      py + 9,
      px + 8,
      py + 12,
      px + 16,
      py + 18,
      px + 5,
      py + 13,
      px + 8,
      py + 9,
    ]);
    if (cell.hp === 1)
      poly(c, "#101a1c", [
        px + 8,
        py + 11,
        px + 13,
        py + 7,
        px + 18,
        py + 7,
        px + 12,
        py + 9,
      ]);
  }
}
export function terrainLayer(w: World, seed: number) {
  const layer = document.createElement("canvas");
  layer.width = w.w * S;
  layer.height = w.h * S;
  const c = layer.getContext("2d")!;
  function paint(x0: number, y0: number, x1: number, y1: number) {
    c.save();
    c.beginPath();
    c.rect(x0 * S, y0 * S, (x1 - x0) * S, (y1 - y0) * S);
    c.clip();
    c.clearRect(x0 * S, y0 * S, (x1 - x0) * S, (y1 - y0) * S);
    for (const draw of [rock, surfaceArt])
      for (let y = Math.max(0, y0 - 1); y < Math.min(w.h, y1 + 1); y++)
        for (let x = Math.max(0, x0 - 1); x < Math.min(w.w, x1 + 1); x++)
          draw(c, w, x, y, seed);
    c.restore();
  }
  paint(0, 0, w.w, w.h);
  if (!shale.complete)
    shale.addEventListener("load", () => paint(0, 0, w.w, w.h), { once: true });
  return {
    image: layer,
    update: (x: number, y: number) => paint(x - 2, y - 2, x + 3, y + 3),
  };
}

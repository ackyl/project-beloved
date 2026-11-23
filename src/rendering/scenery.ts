import { INTERIOR, isSolid, tileAt, type Level } from "../game/level/level";
import { glow, type Brush, type Rect } from "./pixels";

export const T = 16;

const frame = "#172032";
const alloy = "#55697b";
const edge = "#8da5ad";
const signal = "#82ccd1";
const amber = "#cf975b";

/** Deterministic detail seeded by world coordinates. */
export function hash(a: number, b = 0) {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

type Skyline = {
  step: number;
  seed: number;
  min: number;
  max: number;
  wall: string;
  shade: string;
  edge: string;
  glass: string;
  lamps: string[];
};

const skylineLayers: Skyline[] = [
  { step: 24, seed: 11, min: 84, max: 205, wall: "#596381", shade: "#505774", edge: "#67748e", glass: "#495571", lamps: ["#7d89a0"] },
  { step: 43, seed: 29, min: 95, max: 209, wall: "#394762", shade: "#303b57", edge: "#465673", glass: "#29364f", lamps: ["#678998", "#ae938f", "#586e86"] },
  { step: 57, seed: 46, min: 58, max: 158, wall: "#27344c", shade: "#222c43", edge: "#364762", glass: "#1d293f", lamps: ["#5a8791", "#a48275", "#43677e"] },
];

function skyline(r: Rect, w: number, h: number, base: number, offset: number, layer: Skyline) {
  const { step, seed, min, max, wall, shade, edge, glass, lamps } = layer;
  const first = Math.floor(offset / step) - 1;
  for (let i = first; i * step - offset < w + step; i++) {
    const x = i * step - offset;
    const bw = step - 7 - Math.floor(hash(i, seed + 1) * 9);
    const top = base - min - Math.floor(hash(i, seed) * (max - min));
    const body = Math.max(0, h - top);
    if (!body) continue;
    const service = Math.floor(bw * 0.55);
    const crown = 5 + Math.floor(hash(i, seed + 5) * 17);
    const side = Math.floor(bw / 5);

    // The crown, recessed facade and service core have independent silhouettes.
    r(x + 2, top - crown, service, crown, shade);
    r(x + 2, top - crown, service, 1, edge);
    if (hash(i, seed + 7) > 0.36) {
      const mast = 7 + Math.floor(hash(i, seed + 8) * 24);
      r(x + service - 2, top - crown - mast, 1, mast, shade);
      r(x + service - 2, top - crown - mast, 1, 2, lamps[0]);
      r(x + service - 7, top - crown - 6, 11, 1, shade);
    }
    r(x, top, bw, body, wall);
    r(x + bw - side, top + 2, side + 1, body, shade);
    r(x + bw - side, top + 4, 1, body, edge);
    r(x - 1, top, bw + 2, 2, edge);
    if (bw > 24) {
      r(x + 3, top + 4, bw - side - 6, body, glass);
      r(x + 7, top + 4, 1, body, wall);
    }

    // Floors and windows are addressed relative to this tower, never to the viewport.
    for (let floor = Math.max(0, Math.floor((-top - 6) / 8)); top + 6 + floor * 8 < h; floor++) {
      const wy = top + 6 + floor * 8;
      if (floor % 4 === 3) {
        r(x - 1, wy, bw + 2, 2, shade);
        r(x + 1, wy, bw - side - 2, 1, edge);
        continue;
      }
      for (let wx = 4; wx < bw - side - 3; wx += 5) {
        const n = hash(i * 31 + wx, seed * 67 + floor);
        r(x + wx, wy, 3, 3, n > 0.64 ? lamps[Math.floor(n * 47) % lamps.length] : glass);
      }
    }
  }
}

export function city(c: Brush, r: Rect, w: number, h: number, camX: number, camY: number) {
  const sky = c.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#27344f");
  sky.addColorStop(0.45, "#636884");
  sky.addColorStop(0.83, "#c29491");
  sky.addColorStop(1, "#e0ad93");
  c.fillStyle = sky;
  c.fillRect(0, 0, w, h);

  const mx = Math.round(w * 0.77 - camX * 0.026);
  const my = Math.round(h * 0.24 - camY * 0.065);
  glow(c, mx, my, 98, "230,165,148", 0.32);
  for (let y = -21; y <= 21; y++) {
    const span = Math.floor(Math.sqrt(22 * 22 - y * y));
    r(mx - span, my + y, span * 2 + 1, 1, y > 4 ? "#dba899" : "#e9c4ae");
  }
  r(mx - 14, my + 9, 32, 1, "#c69794");
  r(mx - 8, my + 15, 23, 1, "#c99b95");
  for (let i = 0; i < 8; i++) {
    const cloud = Math.round((i * 161 - camX * 0.08) % (w + 140)) - 45;
    const y = Math.round(h * (0.18 + hash(i, 56) * 0.42) - camY * 0.09);
    r(cloud, y, 18 + Math.floor(hash(i, 61) * 56), 1, "#9d8294");
    r(cloud + 9, y + 2, 24, 1, "#81798f");
  }

  skyline(r, w, h, Math.round(h * 0.68 + 73 - camY * 0.19), Math.round(camX * 0.12), skylineLayers[0]);
  skyline(r, w, h, Math.round(h * 0.75 + 128 - camY * 0.32), Math.round(camX * 0.26), skylineLayers[1]);
  skyline(r, w, h, Math.round(h * 0.88 + 108 - camY * 0.45), Math.round(camX * 0.44), skylineLayers[2]);
}

export function drawInteriorTile(r: Rect, level: Level, tx: number, ty: number, x: number, y: number) {
  if (!INTERIOR.has(tileAt(level, tx, ty))) return;
  const above = tileAt(level, tx, ty - 1);
  r(x, y, T, T, "#343e53");
  if (tx % 4 === 0) {
    r(x, y, 1, T, "#252e40");
    r(x + 1, y, 1, T, "#414e62");
  }
  if (!INTERIOR.has(above)) {
    r(x, y, T, 6, "#242d41");
    r(x, y + 6, T, 1, "#505e70");
    r(x, y + 7, T, 2, "#2c374b");
    if (tx % 4 === 2) {
      r(x, y + 4, T, 2, "#657c87");
      r(x + 2, y + 4, 12, 1, "#9fbdba");
    }
  }
  if (isSolid(level, tx, ty + 1)) {
    r(x, y + T - 12, T, 12, "#30394c");
    r(x, y + T - 11, T, 1, "#434e61");
    r(x + 1, y + T - 8, 1, 1, "#535e6c");
    r(x, y + T - 3, T, 3, "#202b3f");
  }
}

export function drawTile(r: Rect, level: Level, tx: number, ty: number, x: number, y: number) {
  const ch = tileAt(level, tx, ty);
  if (ch === "." || ch === "w") return;
  const above = tileAt(level, tx, ty - 1);
  const n = hash(tx, ty);
  switch (ch) {
    case "#": {
      const surface = !isSolid(level, tx, ty - 1);
      r(x, y, T, T, surface ? "#434f61" : "#293347");
      if (surface) {
        r(x, y, T, 1, "#8da4aa");
        r(x, y + 2, T, 3, "#333f53");
        r(x + 15, y + 7, 1, 8, "#333f53");
        r(x + 2, y + 8, 2, 1, "#6e7a80");
        if (tx % 4 < 2) r(x, y + 12, T, 1, "#9e846e");
      } else if (n > 0.57) {
        r(x + 2, y + 2, 12, 9, "#252e40");
        r(x + 3, y + 3, 10, 1, "#3a4759");
        r(x + 5, y + 6, 6, 1, "#374355");
      }
      return;
    }
    case "B": {
      const left = tileAt(level, tx - 1, ty) === "B";
      const right = tileAt(level, tx + 1, ty) === "B";
      const deck = left || right;
      const facade = deck && above === "B" && tileAt(level, tx, ty + 1) === "B";
      if (facade) {
        r(x, y, T, T, "#3b4b60");
        r(x, y, T, 1, "#526277");
        r(x, y + 15, T, 1, "#303b51");
        if (tx % 3 === 1 || !left || !right) {
          r(x + 1, y, 5, T, "#45596c");
          r(x + 1, y, 1, T, "#667b89");
          return;
        }
        r(x + 2, y + 4, 14, 9, "#27354c");
        r(x + 3, y + 5, 12, 5, ty % 3 === 0 ? "#6f818b" : "#4f6579");
        r(x + 3, y + 5, 12, 1, ty % 3 === 0 ? "#a1a59d" : "#607b8d");
        r(x + 3, y + 11, 12, 1, "#5b6d80");
        return;
      }
      r(x, y, T, T, deck ? alloy : "#4b5a6e");
      r(x, y + 2, T, 1, "#64788a");
      r(x, y + 14, T, 2, frame);
      if (deck) {
        r(x + 1, y + 5, 14, 7, "#3b495e");
        r(x + 2, y + 5, 11, 1, "#485b70");
        r(x + 2, y + 10, 1, 1, edge);
        if (tx % 5 === 2) r(x + 10, y + 8, 3, 1, signal);
      }
      if (above !== "B") r(x, y, T, 1, edge);
      if (!left) {
        r(x, y + 1, 2, 13, "#273349");
        r(x + 2, y + 3, 1, 10, "#64788a");
      }
      if (!right) r(x + 13, y + 1, 3, 13, "#283549");
      return;
    }
    case "M":
      r(x, y, T, T, n > 0.5 ? "#48596b" : "#3f4d62");
      r(x, y, T, 1, above !== "M" ? edge : "#61717f");
      r(x, y + 13, T, 3, "#272f44");
      r(x + 14, y + 2, 2, 11, "#2f3b51");
      r(x + 2, y + 3, 1, 1, edge);
      r(x + 11, y + 11, 1, 1, edge);
      for (let slot = 6; slot < 11; slot += 2) r(x + 4, y + slot, 7, 1, "#263144");
      if (n > 0.62) r(x + 9, y + 3, 3, 1, amber);
      return;
    case "=":
    case "_":
      r(x, y, T, 5, frame);
      r(x, y, T, 1, edge);
      r(x, y + 1, T, 2, alloy);
      for (const dx of [3, 11]) {
        r(x + dx, y + 4, 2, 3, "#324157");
        r(x + dx, y + 2, 1, 1, amber);
      }
      return;
    case "H":
    case "L":
      for (const dx of [2, 12]) {
        r(x + dx, y, 3, T, frame);
        r(x + dx, y, 1, T, alloy);
      }
      for (let rung = 2; rung < T; rung += 5) {
        r(x + 4, y + rung, 8, 2, "#4d606f");
        r(x + 4, y + rung, 8, 1, "#94a4a4");
      }
      return;
  }
}

/** Recessed observation bay with a second city silhouette behind glass. */
export function observationBay(r: Rect, x: number, y: number) {
  r(x - 45, y - 64, 90, 44, "#283245");
  r(x - 43, y - 63, 86, 42, "#58677d");
  r(x - 41, y - 61, 82, 36, "#1b263c");
  r(x - 40, y - 60, 80, 33, "#626d87");
  r(x - 40, y - 47, 80, 20, "#82818e");
  r(x - 40, y - 40, 80, 13, "#9b848c");
  for (let i = 0; i < 10; i++) {
    const bx = x - 39 + i * 8;
    const tower = 6 + Math.floor(hash(i, 17) * 20);
    r(bx, y - 27 - tower, 6, tower, "#4d5c77");
    r(bx + 1, y - 30 - tower, 3, 3, "#4d5c77");
    r(bx + 2, y - 24 - tower, 2, 1, "#a4a4a2");
  }
  for (const dx of [-40, -14, 13, 39]) {
    r(x + dx, y - 61, 2, 37, "#263349");
    r(x + dx + 2, y - 60, 1, 32, "#67778f");
  }
  for (const dx of [-37, -11, 16]) {
    r(x + dx, y - 58, 13, 1, "#838fa2");
    r(x + dx, y - 58, 1, 5, "#838fa2");
  }
  r(x - 43, y - 24, 86, 2, "#748899");
  r(x - 38, y - 20, 76, 2, "#273247");
}

export function serviceStation(r: Rect, x: number, y: number) {
  const top = y - 67;
  // Overhead conduit descends into the diagnostic rack.
  r(x - 34, top, 65, 5, "#273145");
  r(x - 33, top + 1, 63, 1, "#58677a");
  r(x + 25, top + 3, 6, 17, "#273145");
  r(x + 27, top + 3, 1, 15, "#58677a");
  for (const dx of [-22, 3, 19]) r(x + dx, top, 2, 5, "#677687");

  r(x - 26, y - 55, 61, 49, "#202a3d");
  r(x - 25, y - 54, 59, 47, "#3c495d");
  r(x - 24, y - 52, 35, 27, "#526176");
  r(x - 22, y - 50, 31, 21, "#26394d");
  r(x - 21, y - 49, 28, 1, "#486477");
  r(x - 18, y - 44, 12, 1, "#709ca8");
  r(x - 18, y - 41, 8, 1, "#577d92");
  r(x - 18, y - 38, 11, 1, "#577d92");
  r(x - 2, y - 45, 1, 10, "#486477");
  for (const [dx, dy] of [[0, 37], [2, 40], [4, 43], [6, 41]]) r(x + dx, y - dy, 2, 2, "#71a5aa");

  r(x + 14, y - 51, 17, 38, "#29364b");
  for (let index = 0; index < 4; index++) {
    const tray = y - 49 + index * 8;
    r(x + 16, tray, 13, 6, "#4f5e70");
    r(x + 17, tray + 1, 5, 1, "#69798a");
    r(x + 26, tray + 2, 2, 1, index === 2 ? amber : "#6d9b9c");
  }
  r(x - 30, y - 23, 44, 3, "#647689");
  r(x - 28, y - 20, 40, 3, "#273246");
  for (const dx of [-26, -8]) {
    r(x + dx, y - 17, 15, 9, "#48566a");
    r(x + dx + 4, y - 15, 6, 1, "#798798");
  }
}

export function bulkhead(r: Rect, x: number, y: number) {
  r(x - 12, y - 48, 24, 4, "#1b2437");
  r(x - 11, y - 47, 22, 1, "#738495");
  r(x - 9, y - 46, 17, 1, "#709eab");
  for (const dx of [-11, 7]) {
    r(x + dx, y - 45, 4, 45, "#222c41");
    r(x + dx, y - 44, 1, 42, "#586b7d");
    r(x + dx, y - 10, 4, 2, "#6f665f");
  }
}

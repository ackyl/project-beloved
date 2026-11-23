import type { Game } from "../game/simulation";
import { tramBox } from "../game/props";
import { INTERIOR, isSolid, tileAt, type Decor, type Level } from "../game/level/level";
import { bottom, centerX } from "../game/physics";
import { android, brush, corpse, glow, poly, printing, type Brush, type Pose, type Rect } from "./pixels";
import { KINDNESS_TICKS, PARTY_TICKS, PIGEON_GATHER_TICKS, PRINT_TICKS, SOLAR_TICKS } from "../game/balance";

// Side-view renderer: sky and parallax skyline, cutaway building, tiles, decor,
// props and the android. Placeholder art drawn in code; no neon.
export const T = 16;

export const palette = {
  skyTop: "#9cc3bd",
  skyLow: "#f1dcb3",
  far: "#86a7a1",
  farShade: "#779790",
  mid: "#b98a6b",
  midShade: "#9c7058",
  brick: "#c98d66",
  mortar: "#ad7656",
  trim: "#6f4b3c",
  wallpaper: "#ead5b0",
  stripe: "#e0c79f",
  baseboard: "#a77c5c",
  street: "#8f8274",
  curb: "#b2a593",
  deep: "#6f655b",
  scrap: "#6e6a62",
  rust: "#9a5d3c",
  rivet: "#8e8a80",
  plank: "#9a6a48",
  plankHi: "#b98457",
  rail: "#7a5a44",
  window: "#f4c77f",
  windowDark: "#5d4a44",
  solar: "#4d7a9c",
  solarLine: "#86b2c9",
  leaf: "#6f9a5a",
  leafDark: "#4f7444",
  pot: "#b8644a",
  dumpster: "#5c7d69",
  cloth: ["#e9b8a8", "#f0dca0", "#a9cbd8", "#f4efe3", "#c4d6a6"],
};

/** Deterministic pseudo-random value in [0, 1). */
const hash = (a: number, b = 0) => {
  const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return s - Math.floor(s);
};

function skyline(r: Rect, w: number, base: number, offset: number, step: number, seed: number, low: number, high: number, color: string, shade: string, lit: boolean) {
  const first = Math.floor(offset / step) - 1;
  for (let i = first; i * step - offset < w + step; i++) {
    const x = i * step - offset,
      h = low + hash(i, seed) * (high - low),
      bw = step - 2 - Math.floor(hash(i, seed + 9) * 6),
      top = base - h;
    r(x, top, bw, h + 400, color);
    r(x + bw - 3, top, 3, h + 400, shade);
    if (hash(i, seed + 3) > 0.55) r(x + 3, top - 4, 10, 4, shade);
    if (hash(i, seed + 5) > 0.5) r(x + bw - 13, top - 2, 9, 2, palette.solar);
    if (!lit) continue;
    for (let wy = top + 7; wy < base - 8; wy += 12)
      for (let wx = 4; wx < bw - 8; wx += 10)
        if (hash(i * 31 + wx, wy) > 0.45)
          r(x + wx, wy, 4, 5, hash(wx + i, wy) > 0.3 ? palette.window : palette.windowDark);
  }
}

function drawTile(r: Rect, level: Level, tx: number, ty: number, sx: number, sy: number) {
  const ch = tileAt(level, tx, ty);
  if (ch === ".") return;
  const above = tileAt(level, tx, ty - 1),
    n = hash(tx, ty);
  if (INTERIOR.has(ch)) {
    r(sx, sy, T, T, palette.wallpaper);
    for (let i = 2; i < T; i += 8) r(sx + i, sy, 2, T, palette.stripe);
    if (isSolid(level, tx, ty + 1)) r(sx, sy + T - 3, T, 3, palette.baseboard);
  }
  switch (ch) {
    case "#":
      if (!isSolid(level, tx, ty - 1)) {
        r(sx, sy, T, T, palette.street);
        r(sx, sy, T, 3, palette.curb);
        if (tx % 3 === 0) r(sx + 2, sy + 9, 10, 2, "#a3968a");
      } else {
        r(sx, sy, T, T, palette.deep);
        if (n > 0.6) r(sx + Math.floor(n * 12), sy + 6, 2, 2, "#5f564d");
      }
      return;
    case "B":
      r(sx, sy, T, T, palette.brick);
      for (let y = 0; y < T; y += 4) {
        r(sx, sy + y + 3, T, 1, palette.mortar);
        const off = ((ty * 4 + y) / 4) % 2 ? 4 : 12;
        r(sx + off, sy + y, 1, 3, palette.mortar);
      }
      if (above !== "B") r(sx, sy, T, 2, palette.trim);
      return;
    case "M":
      r(sx, sy, T, T, palette.scrap);
      if (n > 0.4) r(sx + 2, sy + Math.floor(n * 9), 7, 4, palette.rust);
      r(sx + 2, sy + 2, 1, 1, palette.rivet);
      r(sx + 13, sy + 13, 1, 1, palette.rivet);
      if (above !== "M") r(sx, sy, T, 2, "#8a857b");
      return;
    case "=":
    case "_":
      r(sx, sy, T, 4, palette.plank);
      r(sx, sy, T, 1, palette.plankHi);
      r(sx + 3, sy + 4, 2, 3, palette.trim);
      r(sx + 11, sy + 4, 2, 3, palette.trim);
      return;
    case "H":
    case "L":
      r(sx + 2, sy, 2, T, palette.rail);
      r(sx + 12, sy, 2, T, palette.rail);
      for (let y = 2; y < T; y += 5) r(sx + 4, sy + y, 8, 2, palette.plankHi);
      return;
  }
}

function plant(r: Rect, x: number, y: number, size: number) {
  r(x - 4, y - 5, 8, 5, palette.pot);
  r(x - 3, y - 5, 6, 1, "#d27b5d");
  r(x - 3, y - 5 - size, 6, size, palette.leaf);
  r(x - 5, y - 3 - size, 3, size - 2, palette.leafDark);
  r(x + 2, y - 2 - size, 3, size - 3, palette.leafDark);
}

function laundry(c: Brush, r: Rect, x1: number, y1: number, x2: number, y2: number, t: number, reduced: boolean) {
  c.strokeStyle = "#5b4a40";
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(x1, y1);
  c.quadraticCurveTo((x1 + x2) / 2, (y1 + y2) / 2 + 10, x2, y2);
  c.stroke();
  const count = Math.max(3, Math.floor((x2 - x1) / 24));
  for (let i = 0; i < count; i++) {
    const f = (i + 0.7) / (count + 0.4),
      x = x1 + (x2 - x1) * f,
      y = y1 + (y2 - y1) * f + 10 * 2 * f * (1 - f) * 2 - 1,
      sway = reduced ? 0 : Math.round(Math.sin(t / 40 + i));
    r(x + sway, y, 8, 7 + (i % 3) * 3, palette.cloth[i % palette.cloth.length]);
  }
}

function drawDecor(c: Brush, r: Rect, d: Decor, camX: number, camY: number, t: number, reduced: boolean, g: Game) {
  const x = Math.round(d.x * T - camX),
    y = Math.round(d.y * T - camY);
  switch (d.kind) {
    case "replicator":
      glow(c, x, y - 16, 26, "255,214,150", reduced ? 0.35 : 0.3 + Math.sin(t / 50) * 0.06);
      r(x - 9, y - 34, 18, 34, "#7f9c96");
      r(x - 7, y - 32, 14, 28, "#bfe3da");
      r(x - 5, y - 30, 10, 10, "#e8faf3");
      r(x - 10, y - 3, 20, 3, palette.trim);
      r(x - 3, y - 38, 6, 4, "#7f9c96");
      if (g.twist === 1 || g.twist === 1.5) {
        if (reduced || Math.floor(t / 20) % 2) r(x - 2, y - 37, 4, 2, "#e05a45");
        glow(c, x, y - 36, 12, "240,110,80", 0.4);
      }
      if (g.rebuilt) r(x + 6, y - 20, 3, 5, "#d27b5d");
      return;
    case "deathBoard":
      r(x - 18, y - 22, 36, 22, palette.trim);
      r(x - 16, y - 20, 32, 18, "#c9a16f");
      for (let i = 0; i < 4; i++) r(x - 14 + i * 8, y - 17 + (i % 2) * 3, 6, 7, "#f4efe3");
      r(x - 16, y - 26, 32, 3, "#f0e3c6");
      if (g.twist >= 2) {
        r(x + 8, y - 21, 10, 6, "#fffaf0");
        r(x + 9, y - 19, 7, 1, "#3b332e");
        r(x + 9, y - 17, 5, 1, "#3b332e");
        r(x + 12, y - 22, 2, 2, "#e05a45");
      }
      return;
    case "sofa":
      r(x - 18, y - 12, 36, 8, "#7d9f93");
      r(x - 18, y - 18, 36, 7, "#6b8c80");
      r(x - 20, y - 14, 4, 10, "#6b8c80");
      r(x + 16, y - 14, 4, 10, "#6b8c80");
      r(x - 16, y - 4, 2, 4, palette.trim);
      r(x + 14, y - 4, 2, 4, palette.trim);
      return;
    case "lamp":
      glow(c, x, y - 22, 20, "255,214,150", 0.35);
      r(x - 1, y - 18, 2, 18, palette.trim);
      r(x - 5, y - 26, 10, 8, "#f2c28a");
      return;
    case "plant":
      plant(r, x, y, 7);
      return;
    case "solar":
      poly(c, palette.solar, [x - 12, y, x + 10, y, x + 6, y - 12, x - 8, y - 12]);
      r(x - 7, y - 7, 13, 1, palette.solarLine);
      r(x - 1, y, 2, 1, palette.trim);
      return;
    case "antenna":
      r(x - 8, y - 3, 16, 2, "#5b524b");
      r(x - 5, y - 8, 10, 2, "#5b524b");
      r(x - 1, y - 14, 2, 12, "#5b524b");
      if (!reduced && Math.floor(t / 30) % 2) r(x - 1, y - 16, 2, 2, "#e46f55");
      return;
    case "dumpster":
      r(x - 20, y - 22, 40, 22, palette.dumpster);
      r(x - 22, y - 25, 44, 4, "#4c6a58");
      r(x - 16, y - 14, 32, 1, "#4c6a58");
      plant(r, x, y - 25, 8);
      r(x + 2, y - 33, 3, 3, "#d2563f");
      return;
    case "noodleCart": {
      r(x - 16, y - 18, 32, 14, "#c7684d");
      r(x - 16, y - 18, 32, 2, "#e08a64");
      r(x - 18, y - 48, 36, 4, "#f0dca0");
      for (let i = 0; i < 6; i++) r(x - 18 + i * 6, y - 44, 3, 3, i % 2 ? "#f0dca0" : "#c7684d");
      r(x - 16, y - 44, 1, 26, palette.trim);
      r(x + 15, y - 44, 1, 26, palette.trim);
      // The fryer: a very hot pot.
      r(x - 11, y - 27, 22, 9, "#3b332e");
      r(x - 10, y - 28, 20, 2, "#e8a640");
      const bubble = reduced ? 0 : Math.floor(t / 9) % 4;
      r(x - 7 + bubble * 3, y - 30, 2, 2, "#f6cf6e");
      r(x + 4 - bubble, y - 29, 2, 1, "#f6cf6e");
      glow(c, x, y - 28, 14, "255,190,110", 0.3);
      r(x - 10, y - 4, 4, 4, "#3b332e");
      r(x + 6, y - 4, 4, 4, "#3b332e");
      return;
    }
    case "vending":
      r(x - 9, y - 30, 18, 30, "#d65f49");
      r(x - 7, y - 27, 10, 18, "#f1e6cf");
      for (let i = 0; i < 3; i++) r(x - 6, y - 25 + i * 6, 8, 3, palette.cloth[i]);
      r(x + 5, y - 26, 2, 8, "#3b332e");
      r(x - 7, y - 6, 10, 3, "#3b332e");
      return;
    case "streetLamp":
      r(x - 1, y - 40, 2, 40, "#5b524b");
      r(x - 1, y - 42, 8, 2, "#5b524b");
      r(x + 4, y - 40, 5, 3, "#f1e6cf");
      r(x - 5, y - 18, 10, 6, palette.solar);
      return;
    case "tramSign":
      r(x - 1, y - 34, 2, 34, "#5b524b");
      r(x - 8, y - 42, 16, 10, "#f0dca0");
      r(x - 6, y - 39, 12, 1, palette.trim);
      r(x - 6, y - 36, 8, 1, palette.trim);
      return;
    case "compactor": {
      const top = y - 8 * T;
      r(x - 42, top, 4, 8 * T, "#55504a");
      r(x + 38, top, 4, 8 * T, "#55504a");
      r(x - 44, top - 6, 88, 6, "#d29a3d");
      for (let i = 0; i < 10; i++) r(x - 42 + i * 8, top - 5, 4, 4, "#3b332e");
      return;
    }
    case "compactorButton":
      r(x - 1, y - 14, 3, 14, "#55504a");
      r(x - 4, y - 19, 9, 6, "#3b332e");
      r(x - 2, y - 18, 5, 4, "#e05a45");
      return;
    case "canal": {
      const x2 = Math.round((d.x2 ?? d.x) * T - camX);
      r(x, y + 5, x2 - x, 2 * T - 5, "#5f8f9d");
      r(x, y + 5, x2 - x, 2, "#9cc7cf");
      for (let i = 0; i < (x2 - x) / 8; i++)
        if ((i + Math.floor(t / 20)) % 3 === 0) r(x + i * 8 + 2, y + 10 + (i % 2) * 6, 4, 1, "#9cc7cf");
      return;
    }
    case "powerStrip":
      r(x - 6, y - 4, 12, 4, "#e9e1cf");
      r(x - 4, y - 3, 2, 2, "#3b332e");
      r(x + 1, y - 3, 2, 2, "#3b332e");
      r(x - 8, y - 2, 2, 2, "#3b332e");
      r(x - 9, y - 22, 1, 20, "#3b332e");
      r(x - 14, y - 26, 10, 6, "#f0dca0");
      r(x - 13, y - 24, 8, 1, "#d65f49");
      return;
    case "powerline": {
      const x2 = Math.round((d.x2 ?? d.x) * T - camX),
        ground = Math.round(30 * T - camY);
      for (const px of [x, x2]) {
        r(px - 1, y - 6, 3, ground - y + 6, "#5b524b");
        r(px - 5, y - 6, 11, 2, "#5b524b");
        r(px - 4, y - 4, 2, 3, "#c7d9cf");
        r(px + 3, y - 4, 2, 3, "#c7d9cf");
      }
      c.strokeStyle = "#2f2b28";
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(x, y);
      c.quadraticCurveTo((x + x2) / 2, y + 3, x2, y);
      c.stroke();
      if (!reduced && Math.floor(t / 7) % 9 === 0) r((x + x2) / 2 + ((t * 7) % 20) - 10, y + 1, 2, 2, "#ffe58a");
      r(x + 6, y + 8, 18, 6, "#f0dca0");
      r(x + 8, y + 10, 14, 1, "#d65f49");
      return;
    }
    case "planterBox":
      r(x - 18, y - 9, 36, 9, "#9a6a48");
      r(x - 18, y - 9, 36, 2, "#b98457");
      r(x - 16, y - 11, 32, 3, "#5a4636");
      for (const dx of [-13, -6, 8, 14]) {
        r(x + dx, y - 17, 2, 7, palette.leaf);
        r(x + dx - 2, y - 15, 3, 2, palette.leafDark);
      }
      r(x - 1, y - 12, 6, 1, "#7a5a44");
      return;
    case "drip": {
      const top = y - 3 * T;
      r(x - 14, top, 18, 3, "#7a8f8a");
      r(x + 2, top, 3, 8, "#7a8f8a");
      const fall = reduced ? 10 : (t * 2) % 40;
      r(x + 3, top + 8 + fall, 1, 2, "#9cc7cf");
      r(x - 6, y - 7, 12, 7, palette.pot);
      r(x - 4, y - 11, 8, 4, palette.leaf);
      return;
    }
    case "mirrors": {
      const spots = [
        [-2.9, 27],
        [2.4, 27],
        [5.5, 30],
        [8, 30],
      ];
      for (const [dx, my] of spots) {
        const mx = Math.round((d.x + dx) * T - camX),
          mY = Math.round(my * T - camY);
        c.strokeStyle = "rgba(255,226,150,0.35)";
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(mx, mY - 12);
        c.lineTo(x, y);
        c.stroke();
        r(mx - 1, mY - 8, 2, 8, "#5b524b");
        r(mx - 5, mY - 16, 10, 8, "#cfe3ea");
        r(mx - 4, mY - 15, 3, 6, "#ffffff");
      }
      glow(c, x, y, 16, "255,230,160", 0.4 + (reduced ? 0 : Math.sin(t / 12) * 0.08));
      return;
    }
    case "crane": {
      const top = Math.round((d.y2 ?? 16) * T - camY),
        hookX = Math.round((d.x2 ?? d.x) * T - camX);
      for (let yy = top - 30; yy < y; yy += 10) {
        r(x - 6, yy, 2, 10, "#c9913f");
        r(x + 4, yy, 2, 10, "#c9913f");
        r(x - 6, yy + 4, 12, 1, "#a87632");
      }
      r(hookX - 6 * T - 6, top - 32, x - hookX + 6 * T + 12, 4, "#c9913f");
      return;
    }
    case "laundry":
      laundry(c, r, x, y, Math.round((d.x2 ?? d.x) * T - camX), Math.round((d.y2 ?? d.y) * T - camY), t, reduced);
      return;
    case "tank":
      return;
  }
}

function drawProp(r: Rect, kind: string, x: number, y: number, w: number, h: number) {
  switch (kind) {
    case "crate":
      r(x, y, w, h, "#a8744c");
      r(x + 1, y + 1, w - 2, h - 2, "#c38c5e");
      r(x + 1, y + h / 2 - 1, w - 2, 2, "#a8744c");
      r(x + w / 2 - 1, y + 1, 2, h - 2, "#a8744c");
      return;
    case "pot":
      r(x, y + 2, w, h - 2, palette.pot);
      r(x - 1, y, w + 2, 3, "#d27b5d");
      r(x + 2, y - 4, w - 4, 4, palette.leaf);
      return;
    case "cube":
      r(x, y, w, h, "#7d6f62");
      r(x + 1, y + 1, w - 2, 2, "#9a5d3c");
      r(x + 2, y + h - 3, w - 4, 1, "#5c524a");
      return;
    case "tire":
      r(x, y, w, h, "#3b3632");
      r(x + 3, y + 2, w - 6, h - 4, "#58514b");
      r(x + 5, y + 3, w - 10, h - 6, "#3b3632");
      return;
  }
}

export function scene() {
  const cam = { x: 0, y: 0, ready: false };
  return (c: Brush, g: Game, reduced: boolean) => {
    const w = c.canvas.width,
      h = c.canvas.height,
      r = brush(c),
      t = g.ticks,
      level = g.level,
      p = g.player;
    // Camera follows the player, or the fresh body while dead.
    const dead = g.phase === "dead" && g.last;
    const focusX = dead ? g.last!.x : centerX(p),
      focusY = dead ? g.last!.y : bottom(p);
    const maxX = Math.max(0, level.w * T - w),
      maxY = Math.max(0, level.h * T - h);
    const tx = Math.min(maxX, Math.max(0, focusX * T - w / 2)),
      ty = Math.min(maxY, Math.max(0, focusY * T - h * 0.68));
    if (!cam.ready || reduced) {
      cam.x = tx;
      cam.y = ty;
      cam.ready = true;
    } else {
      cam.x += (tx - cam.x) * 0.16;
      cam.y += (ty - cam.y) * 0.12;
    }
    const camX = Math.round(cam.x),
      camY = Math.round(cam.y);
    view.camX = camX;
    view.camY = camY;
    view.w = w;
    view.h = h;

    // Sky, sun and parallax skyline.
    const sky = c.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, palette.skyTop);
    sky.addColorStop(0.8, palette.skyLow);
    c.fillStyle = sky;
    c.fillRect(0, 0, w, h);
    const sunX = w * 0.78 - camX * 0.03,
      sunY = h * 0.16 - camY * 0.03;
    glow(c, sunX, sunY, 90, "255,236,190", 0.7);
    r(sunX - 10, sunY - 10, 20, 20, "#fff1cf");
    const street = 30 * T - camY;
    skyline(r, w, street * 0.35 + h * 0.4 - 20, camX * 0.15, 34, 11, 50, 140, palette.far, palette.farShade, false);
    skyline(r, w, street * 0.65 + h * 0.2, camX * 0.4, 46, 37, 40, 120, palette.mid, palette.midShade, true);

    // Tiles behind everything that moves.
    const x0 = Math.max(0, Math.floor(camX / T)),
      x1 = Math.min(level.w - 1, Math.ceil((camX + w) / T)),
      y0 = Math.max(0, Math.floor(camY / T)),
      y1 = Math.min(level.h - 1, Math.ceil((camY + h) / T));
    for (let yy = y0; yy <= y1; yy++)
      for (let xx = x0; xx <= x1; xx++)
        drawTile(r, level, xx, yy, xx * T - camX, yy * T - camY);
    for (const d of level.decor) drawDecor(c, r, d, camX, camY, t, reduced, g);
    if (g.board.laughing) drawBunting(c, camX, camY, t, reduced);
    drawMachines(c, r, g, camX, camY, t, reduced);

    // Props and bodies, then the player, then the carried thing above the head.
    const held = p.holding;
    const drawBody = (b: Game["bodies"][number]) => {
      const bx = Math.round(b.x * T - camX),
        by = Math.round(b.y * T - camY),
        bw = Math.round(b.w * T),
        bh = Math.round(b.h * T);
      if (b.kind === "corpse")
        corpse(c, (b.x + b.w / 2) * T - camX, (b.y + b.h) * T - camY, b.pose ?? "flat", b.tint, (b.attempt ?? 0) % 2 === 1);
      else drawProp(r, b.kind, bx, by, bw, bh);
    };
    for (const b of g.bodies) if (b.id !== held || g.phase !== "alive") drawBody(b);
    if (g.phase === "alive") {
      const pose: Pose = p.climbing ? "climb" : p.zip || p.pigeons > PIGEON_GATHER_TICKS || g.crane?.player ? "air" : !p.grounded ? "air" : Math.abs(p.vx) > 0.4 ? "walk" : "idle";
      const px = centerX(p) * T - camX,
        py = bottom(p) * T - camY;
      if (p.heat > 0) glow(c, px, py - 9, 22, "255,170,90", Math.min(0.7, p.heat / SOLAR_TICKS));
      android(c, px, py, p.facing < 0, pose === "climb" && p.vy === 0 ? 0 : t, pose, reduced);
      if (g.rebuilt) rebuiltParts(r, px, py, p.facing < 0);
      if (p.zip) {
        r(px - 1, py - 26, 2, 8, "#5b4a40");
        r(px - 4, py - 27, 8, 2, "#5b4a40");
      }
      if (p.planted) {
        const grow = Math.min(8, Math.floor(p.planted / 20));
        r(px - 1, py - 18 - grow, 2, grow, palette.leaf);
        r(px - 4, py - 18 - grow, 3, 2, palette.leafDark);
        r(px + 1, py - 17 - grow, 3, 2, palette.leaf);
      }
      if (p.damp > 0 && !reduced) r(px - 3 + ((t * 3) % 6), py - 20 + ((t * 2) % 14), 1, 2, "#9cc7cf");
      if (p.pigeons) {
        const lifting = p.pigeons > PIGEON_GATHER_TICKS,
          n = lifting ? 6 : Math.min(6, Math.floor(p.pigeons / 14) + 1);
        for (let i = 0; i < n; i++) {
          const flap = reduced ? 0 : Math.floor(t / 4 + i) % 2;
          const bx = lifting ? px - 14 + i * 5 : px - 16 + i * 6 + (i % 2) * 2,
            by = lifting ? py - 24 - (i % 2) * 3 : py - 3;
          r(bx, by, 5, 3, "#8f949a");
          r(bx + 3, by - 2, 3, 3, "#a5a9ae");
          if (lifting) r(bx - 1, by - 2 - flap * 2, 3, 2, "#c4c8cc");
        }
      }
      if (g.kindness > 0) {
        const bowls = Math.min(8, Math.ceil((KINDNESS_TICKS - g.kindness) / 5));
        for (let i = 0; i < bowls; i++) {
          const fall = Math.max(0, (KINDNESS_TICKS - g.kindness) * 2 - i * 10);
          r(px - 5, py - 24 - i * 3 - Math.max(0, 60 - fall), 10, 3, i % 2 ? "#f4efe3" : "#a9cbd8");
        }
      }
      const lastBonk = p.bonks.at(-1);
      if (lastBonk && t - lastBonk.tick < 24)
        for (let i = 0; i < 3; i++) {
          const a = t / 5 + (i * Math.PI * 2) / 3;
          r(centerX(p) * T - camX + Math.cos(a) * 8 - 1, p.y * T - camY - 4 + Math.sin(a) * 2, 2, 2, "#ffe58a");
        }
    } else if (g.phase === "printing") {
      glow(c, centerX(p) * T - camX, bottom(p) * T - camY - 14, 28, "255,240,200", 0.5);
      printing(c, centerX(p) * T - camX, bottom(p) * T - camY, g.phaseTicks / PRINT_TICKS);
      if (g.rebuilt && g.phaseTicks >= PRINT_TICKS - 2) rebuiltParts(r, centerX(p) * T - camX, bottom(p) * T - camY, p.facing < 0);
    }
    for (const b of g.bodies) if (b.id === held && g.phase === "alive") drawBody(b);

    // Rooftop party confetti.
    if (g.party && g.party < PARTY_TICKS && !reduced)
      for (let i = 0; i < 40; i++) {
        const fx = (hash(i, 3) * w + Math.sin(t / 30 + i) * 12) % w,
          fy = ((hash(i, 9) * h + t * (0.6 + hash(i, 5))) % h);
        r(fx, fy, 2, 3, palette.cloth[i % palette.cloth.length]);
      }
    // Death sparks and loose bolts, computed from time since death.
    if (dead && g.phaseTicks < 45 && !reduced) {
      const ox = g.last!.x * T - camX,
        oy = (g.last!.y - 0.6) * T - camY,
        s = g.phaseTicks / 60;
      for (let i = 0; i < 16; i++) {
        const a = hash(i, g.last!.attempt) * Math.PI * 2,
          v = 3 + hash(i + 7, g.last!.attempt) * 5;
        const px = ox + Math.cos(a) * v * s * T,
          py = oy + (Math.sin(a) * v * s - 0.5 * -18 * s * s) * T;
        r(px, py, 2, 2, i % 3 ? "#ffd27a" : "#8e8a80");
      }
    }
  };
}

/** Shared with the DOM shell so it can place speech bubbles over the canvas. */
export const view = { camX: 0, camY: 0, w: 1, h: 1 };

const NEIGHBOUR_LOOK = {
  pell: { hair: "#d9d4cc", skin: "#c99572", body: "#c7684d", trim: "#f0dca0", h: 21 },
  rook: { hair: "#4d7a9c", skin: "#b07a58", body: "#e9b8a8", trim: "#f4efe3", h: 16 },
  bas: { hair: "#d29a3d", skin: "#a56b4c", body: "#5c7d69", trim: "#7a5a44", h: 25 },
  juniper: { hair: "#e3c47a", skin: "#8f5e44", body: "#6f9a5a", trim: "#4f7444", h: 22 },
} as const;

function drawNeighbour(r: Rect, id: keyof typeof NEIGHBOUR_LOOK, x: number, y: number, t: number, reduced: boolean) {
  const L = NEIGHBOUR_LOOK[id],
    h = L.h,
    bob = reduced ? 0 : Math.floor(t / 45 + x) % 2,
    top = y - h - bob;
  const w = id === "bas" ? 14 : id === "rook" ? 9 : 11;
  r(x - w / 2, top + 7, w, h - 9, L.body); // body
  r(x - w / 2 + 2, y - 3, 3, 3, "#3b332e"); // feet
  r(x + w / 2 - 5, y - 3, 3, 3, "#3b332e");
  r(x - 4, top + 1, 8, 7, L.skin); // head
  r(x + 1, top + 4, 1, 1, "#2a2724");
  r(x - 2, top + 4, 1, 1, "#2a2724");
  switch (id) {
    case "pell":
      r(x - 5, top - 1, 10, 3, L.hair);
      r(x - 2, top - 4, 5, 4, L.hair); // bun
      r(x - 4, top + 10, 8, h - 14, L.trim); // apron
      break;
    case "rook":
      r(x - 5, top, 10, 3, L.hair); // cap
      r(x + 3, top + 2, 4, 1, L.hair);
      r(x + 4, top + 9, 5, 6, L.trim); // notebook
      r(x + 5, top + 11, 3, 1, "#7a5a44");
      break;
    case "bas":
      r(x - 5, top - 1, 10, 3, L.hair); // cap
      r(x - 4, top + 6, 8, 4, "#6b4a33"); // beard
      r(x - 6, top + 9, 2, 8, L.trim); // straps
      r(x + 4, top + 9, 2, 8, L.trim);
      break;
    case "juniper":
      r(x - 8, top, 16, 2, L.hair); // straw hat
      r(x - 4, top - 3, 8, 3, L.hair);
      r(x + 6, top + 12, 6, 5, "#7a8f8a"); // watering can
      r(x + 11, top + 11, 3, 2, "#7a8f8a");
      break;
  }
}

function drawMachines(c: Brush, r: Rect, g: Game, camX: number, camY: number, t: number, reduced: boolean) {
  for (const n of g.level.neighbours)
    drawNeighbour(r, n.id, Math.round(n.x * T - camX), Math.round(n.y * T - camY), t, reduced);
  const crane = g.crane,
    cm = g.level.machines.crane;
  if (crane && cm) {
    const mx = Math.round(crane.x * T - camX),
      my = Math.round(crane.y * T - camY),
      top = Math.round((cm.liftY - 1.1) * T - camY);
    r(mx - 5, top - 3, 10, 4, "#55504a"); // trolley
    r(mx, top, 1, my - 6 - top, "#3b332e");
    r(mx - 8, my - 6, 16, 6, "#55504a");
    r(mx - 7, my - 2, 14, 2, crane.phase === "lowering" || crane.phase === "lifting" || crane.phase === "moving" ? "#e05a45" : "#8e8a80");
  }
  const vm = g.level.machines.vending,
    v = g.vending;
  if (vm && v) {
    const x = Math.round(vm.x * T - camX),
      y = Math.round(vm.y * T - camY);
    const shake = v.phase === "up" && v.shakes && !reduced ? (Math.floor(t / 2) % 2 ? 1 : -1) * Math.min(2, v.shakes) : 0;
    const angle = v.phase === "tipping" ? (v.timer / 18) * (Math.PI / 2) * v.dir : v.phase === "down" ? (Math.PI / 2) * v.dir : 0;
    c.save();
    c.translate(x + shake + (v.dir > 0 ? 9 : -9) * (angle ? 1 : 0), y);
    c.rotate(angle);
    c.translate(angle ? (v.dir > 0 ? -9 : 9) : 0, 0);
    const rr = brush(c);
    rr(-9, -30, 18, 30, "#d65f49");
    rr(-7, -27, 10, 18, "#f1e6cf");
    for (let i = 0; i < 3; i++) rr(-6, -25 + i * 6, 8, 3, palette.cloth[i]);
    rr(5, -26, 2, 8, "#3b332e");
    rr(-7, -6, 10, 3, "#3b332e");
    c.restore();
  }

  const tram = tramBox(g);
  if (tram) {
    const x = Math.round(tram.x * T - camX),
      y = Math.round(tram.y * T - camY),
      w = Math.round(tram.w * T),
      h = Math.round(tram.h * T);
    r(x, y + 4, w, h - 8, "#e6cf9b");
    r(x, y + h - 12, w, 4, "#6f9e95");
    r(x + 2, y, w - 4, 5, "#c9b07c");
    for (let i = 0; i < Math.floor(w / 14); i++) {
      r(x + 6 + i * 14, y + 9, 9, 10, "#5d4a44");
      r(x + 7 + i * 14, y + 10, 7, 8, i % 3 ? "#f4c77f" : "#a9cbd8");
    }
    r(x + w - 6, y + 8, 4, 22, "#c7684d");
    r(x + 10, y - 10, 1, 10, "#3b332e");
    r(x + 6, y - 11, 10, 1, "#3b332e");
    for (const wx of [x + 8, x + w - 18]) r(wx, y + h - 4, 10, 4, "#3b332e");
  }
  const m = g.level.machines.compactor,
    k = g.compactor;
  if (m && k) {
    const x = Math.round(m.x * T - camX),
      w = Math.round(m.w * T),
      plate = Math.round(k.plate * T - camY),
      top = Math.round((m.floor - 8) * T - camY);
    r(x + w / 2 - 3, top, 6, plate - 8 - top, "#8e8a80");
    r(x, plate - 8, w, 8, "#6e6a62");
    r(x, plate - 2, w, 2, "#3b332e");
    for (let i = 0; i < w / 8; i++) r(x + i * 8 + 2, plate - 6, 4, 2, "#d29a3d");
    if (k.phase === "warning" && (reduced || Math.floor(t / 8) % 2)) {
      r(x - 6, top - 12, 5, 5, "#e05a45");
      r(x + w + 1, top - 12, 5, 5, "#e05a45");
      glow(c, x + w / 2, top - 10, 30, "240,110,80", 0.35);
    }
  }
}

/** Pot-lid cheek from Pell, a toy arm from Rook, a sprouting shoulder from Juniper. */
function rebuiltParts(r: Rect, x: number, feetY: number, left: boolean) {
  const X = (dx: number, w: number) => Math.round(x + (left ? -dx - w : dx));
  const y = Math.round(feetY);
  r(X(1, 4), y - 11, 4, 4, "#9a948c"); // pot lid cheek
  r(X(2, 2), y - 10, 2, 1, "#c9c3ba");
  r(X(-8, 3), y - 8, 3, 5, "#e05a45"); // toy arm
  r(X(-8, 3), y - 4, 3, 2, "#4d7a9c");
  r(X(4, 2), y - 9, 2, 2, "#6f9a5a"); // sprout
  r(X(5, 3), y - 11, 3, 2, "#8fbf6a");
}

/** Bunting across the roof once the block has thrown its party. */
function drawBunting(c: Brush, camX: number, camY: number, t: number, reduced: boolean) {
  const x1 = Math.round(22.5 * T - camX),
    x2 = Math.round(45.5 * T - camX),
    y = Math.round(15.6 * T - camY);
  c.strokeStyle = "#5b4a40";
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(x1, y);
  c.quadraticCurveTo((x1 + x2) / 2, y + 10, x2, y);
  c.stroke();
  for (let i = 1; i < 18; i++) {
    const f = i / 18,
      px = x1 + (x2 - x1) * f,
      py = y + 20 * f * (1 - f) + (reduced ? 0 : Math.round(Math.sin(t / 25 + i) * 0.6));
    poly(c, palette.cloth[i % palette.cloth.length], [px - 3, py, px + 3, py, px, py + 6]);
  }
}

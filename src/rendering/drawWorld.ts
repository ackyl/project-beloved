import { drawNeighbour } from "./neighbours";
import type { Game } from "../game/simulation";
import { tramBox } from "../game/props";
import type { Decor } from "../game/level/level";
import { bottom, centerX } from "../game/physics";
import { android, brush, corpse, glow, poly, printing, type Brush, type Pose, type Rect } from "./pixels";
import { KINDNESS_TICKS, PARTY_TICKS, PIGEON_GATHER_TICKS, PRINT_TICKS, SOLAR_TICKS } from "../game/balance";

import { bulkhead, city, drawInteriorTile, drawTile, hash, observationBay, serviceStation, T } from "./scenery";

const palette = {
  trim: "#161f2c",
  solar: "#354d6a",
  solarLine: "#80a7b4",
  leaf: "#6f9981",
  leafDark: "#456869",
  pot: "#8d6164",
  dumpster: "#486271",
  cloth: ["#bf827a", "#dcc38c", "#88b1bd", "#e2d7c4", "#92b0a2"],
};

function plant(r: Rect, x: number, y: number, size: number) {
  r(x - 4, y - 5, 8, 5, palette.pot);
  r(x - 3, y - 5, 6, 1, "#d27b5d");
  r(x - 3, y - 5 - size, 6, size, palette.leaf);
  r(x - 5, y - 3 - size, 3, size - 2, palette.leafDark);
  r(x + 2, y - 2 - size, 3, size - 3, palette.leafDark);
}

function vendingCabinet(r: Rect, x: number, y: number) {
  r(x - 9, y - 29, 18, 29, "#171f30");
  r(x - 7, y - 30, 14, 29, "#9a5459");
  r(x - 8, y - 27, 17, 1, "#e7aa89");
  r(x - 7, y - 25, 10, 15, "#2a384d");
  r(x - 6, y - 24, 8, 13, "#455969");
  for (let i = 0; i < 3; i++) {
    r(x - 6, y - 22 + i * 4, 8, 1, "#87a0a7");
    r(x - 5, y - 23 + i * 4, 2, 1, palette.cloth[i]);
    r(x - 2, y - 23 + i * 4, 2, 1, "#e2cb9e");
  }
  r(x + 4, y - 25, 3, 5, "#242d41");
  r(x + 5, y - 24, 1, 2, "#a1e5d0");
  r(x - 5, y - 7, 10, 4, "#252b3d");
  r(x - 4, y - 7, 8, 1, "#c48376");
  r(x + 7, y - 26, 1, 24, "#713f4b");
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
    const width = [8, 6, 10][i % 3], height = [7, 11, 8][i % 3];
    r(x + sway, y, width, height, palette.cloth[i % palette.cloth.length]);
    r(x + sway, y + height - 2, width, 1, "rgba(47,50,66,0.25)");
    r(x + sway + 2, y - 1, 1, 2, "#4f5363");
  }
}

const backdropKinds = new Set<Decor["kind"]>(["observationBay", "serviceStation", "bulkhead"]);

function drawDecor(c: Brush, r: Rect, d: Decor, camX: number, camY: number, t: number, reduced: boolean, g: Game) {
  const x = Math.round(d.x * T - camX),
    y = Math.round(d.y * T - camY);
  switch (d.kind) {
    case "observationBay":
      observationBay(r, x, y);
      return;
    case "serviceStation":
      serviceStation(r, x, y);
      return;
    case "bulkhead":
      bulkhead(r, x, y);
      return;
    case "replicator":
      glow(c, x, y - 25, 36, "108,236,224", 0.23);
      r(x - 12, y - 37, 24, 35, "#151f30");
      r(x - 10, y - 41, 20, 39, "#4c6379");
      r(x - 8, y - 43, 16, 5, "#8199aa");
      r(x - 8, y - 39, 16, 1, "#1a2c41");
      r(x - 7, y - 34, 14, 29, "#182b40");
      r(x - 6, y - 32, 12, 25, "#315c70");
      r(x - 5, y - 30, 10, 20, "#477b88");
      r(x - 5, y - 31, 10, 2, "#8ce2de");
      r(x - 6, y - 27, 1, 16, "#6fafb6");
      r(x + 5, y - 27, 1, 16, "#6fafb6");
      r(x - 8, y - 36, 16, 1, "#72b8c2");
      r(x + 8, y - 26, 3, 11, "#2c3c51");
      r(x + 9, y - 24, 1, 2, "#d2ab72");
      r(x - 14, y - 4, 28, 4, "#242e41");
      r(x - 10, y - 4, 20, 1, "#8293a2");
      r(x - 3, y - 42, 6, 2, g.twist === 1 || g.twist === 1.5 ? "#ef8a6c" : "#b8fff1");
      if (g.rebuilt) r(x + 8, y - 14, 3, 5, "#d27b5d");
      return;
    case "deathBoard":
      r(x - 20, y - 24, 40, 24, "#1b2437");
      r(x - 19, y - 23, 38, 21, "#697583");
      r(x - 17, y - 20, 34, 16, "#82665f");
      r(x - 16, y - 26, 32, 1, "#9fa9a9");
      for (let i = 0; i < 4; i++) {
        const px = x - 15 + i * 8, py = y - 18 + (i % 2) * 3;
        r(px, py, 6, 8, "#ddd5be");
        r(px + 1, py + 1, 4, 4, "#6c7885");
        r(px + 2, py + 6, 3, 1, "#a59b88");
      }
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
      r(x - 8, y - 3, 16, 2, "#566a7e");
      r(x - 5, y - 8, 10, 2, "#8a9ca7");
      r(x - 1, y - 14, 2, 13, "#657a8d");
      r(x - 1, y - 16, 2, 2, "#df8975");
      return;
    case "dumpster":
      r(x - 20, y - 23, 40, 23, "#212b3d");
      r(x - 19, y - 22, 38, 18, palette.dumpster);
      r(x - 22, y - 25, 44, 4, "#627e85");
      r(x - 22, y - 25, 44, 1, "#8aa1a3");
      r(x - 18, y - 20, 36, 2, "#334c60");
      for (const dx of [-15, -7, 7, 15]) {
        r(x + dx, y - 17, 2, 11, "#365162");
        r(x + dx - 1, y - 17, 1, 11, "#587586");
      }
      r(x - 5, y - 14, 10, 4, "#b4956b");
      r(x - 3, y - 13, 6, 1, "#655953");
      r(x - 15, y - 4, 5, 4, "#111b2b");
      r(x + 10, y - 4, 5, 4, "#111b2b");
      plant(r, x, y - 25, 8);
      r(x + 2, y - 33, 3, 3, "#d98670");
      return;
    case "noodleCart": {
      r(x - 17, y - 19, 34, 15, "#242a3c");
      r(x - 16, y - 17, 32, 11, "#a65b59");
      r(x - 14, y - 14, 13, 6, "#784758");
      r(x - 12, y - 13, 8, 1, "#c27a6b");
      r(x + 3, y - 13, 10, 2, "#d08a71");
      r(x - 17, y - 20, 34, 2, "#b89b87");
      r(x - 18, y - 48, 36, 5, "#38465b");
      r(x - 16, y - 50, 32, 2, "#647689");
      r(x - 17, y - 45, 34, 1, "#e6ad76");
      r(x - 8, y - 48, 16, 2, "#a86c67");
      for (const dx of [-16, 15]) {
        r(x + dx, y - 43, 2, 23, "#313b4f");
        r(x + dx, y - 43, 1, 23, "#647080");
      }
      // Fryer glow, kept compact so the hot surface remains legible.
      glow(c, x, y - 28, 13, "255,190,110", 0.26);
      r(x - 11, y - 27, 22, 8, "#302a35");
      r(x - 9, y - 24, 18, 1, "#89665c");
      r(x - 10, y - 28, 20, 2, "#e8a640");
      const bubble = reduced ? 0 : Math.floor(t / 9) % 4;
      r(x - 7 + bubble * 3, y - 30, 2, 2, "#f6cf6e");
      r(x + 4 - bubble, y - 29, 2, 1, "#f6cf6e");
      for (const dx of [-11, 7]) {
        r(x + dx, y - 5, 5, 5, "#20293a");
        r(x + dx + 2, y - 3, 1, 1, "#75828d");
      }
      return;
    }
    case "vending":
      vendingCabinet(r, x, y);
      return;
    case "streetLamp":
      glow(c, x + 5, y - 38, 16, "255,198,133", 0.25);
      r(x - 2, y - 40, 4, 40, "#293749");
      r(x - 1, y - 38, 1, 36, "#667788");
      r(x - 2, y - 42, 12, 4, "#394658");
      r(x + 2, y - 39, 7, 1, "#f2bf89");
      r(x - 4, y - 4, 8, 4, "#435468");
      r(x - 5, y - 18, 10, 6, "#354a60");
      r(x - 3, y - 16, 6, 1, "#a4b5b8");
      return;
    case "tramSign":
      r(x - 2, y - 34, 4, 34, "#303e50");
      r(x - 1, y - 33, 1, 31, "#5f7283");
      r(x - 9, y - 43, 18, 11, "#232e42");
      r(x - 8, y - 42, 16, 8, "#4c697c");
      r(x - 6, y - 40, 3, 4, "#e0a576");
      r(x - 1, y - 40, 7, 1, "#bbced0");
      r(x - 1, y - 37, 5, 1, "#83a7ad");
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
      r(x, y, w, h, "#1a2335");
      r(x + 1, y + 1, w - 2, h - 2, "#6f8596");
      r(x + 2, y + 4, w - 4, h - 6, "#495e76");
      r(x + 2, y + 4, w - 4, 1, "#334259");
      r(x + 3, y + 6, w - 6, 1, "#b78a63");
      r(x + 2, y + h - 3, 1, 2, "#849ca7");
      r(x + w - 3, y + h - 3, 1, 2, "#849ca7");
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

    city(c, r, w, h, camX, camY);

    // Tiles behind everything that moves.
    const x0 = Math.max(0, Math.floor(camX / T)),
      x1 = Math.min(level.w - 1, Math.ceil((camX + w) / T)),
      y0 = Math.max(0, Math.floor(camY / T)),
      y1 = Math.min(level.h - 1, Math.ceil((camY + h) / T));
    const tiles = (draw: typeof drawTile) => {
      for (let yy = y0; yy <= y1; yy++)
        for (let xx = x0; xx <= x1; xx++)
          draw(r, level, xx, yy, xx * T - camX, yy * T - camY);
    };
    tiles(drawInteriorTile);
    for (const d of level.decor)
      if (backdropKinds.has(d.kind)) drawDecor(c, r, d, camX, camY, t, reduced, g);
    tiles(drawTile);
    for (const d of level.decor)
      if (!backdropKinds.has(d.kind)) drawDecor(c, r, d, camX, camY, t, reduced, g);
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
        r(px - 1, py - 20 - grow, 2, grow, palette.leaf);
        r(px - 4, py - 20 - grow, 3, 2, palette.leafDark);
        r(px + 1, py - 19 - grow, 3, 2, palette.leaf);
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

function drawMachines(c: Brush, r: Rect, g: Game, camX: number, camY: number, t: number, reduced: boolean) {
  for (const n of g.level.neighbours)
    drawNeighbour(r, n.id, Math.round(n.x * T - camX), Math.round(n.y * T - camY));
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
    vendingCabinet(brush(c), 0, 0);
    c.restore();
  }

  const tram = tramBox(g);
  if (tram) {
    const x = Math.round(tram.x * T - camX),
      y = Math.round(tram.y * T - camY),
      w = Math.round(tram.w * T),
      h = Math.round(tram.h * T);
    r(x, y + 3, w, h - 6, "#1a263b");
    r(x + 4, y, w - 9, 5, "#667b90");
    r(x + 2, y + 5, w - 4, h - 11, "#7e939e");
    r(x + 4, y + 7, w - 8, 14, "#263e56");
    for (let wx = x + 6; wx < x + w - 14; wx += 14) {
      r(wx, y + 9, 10, 10, "#46687d");
      r(wx + 1, y + 9, 7, 2, "#81a2ad");
      r(wx + 8, y + 16, 1, 2, "#79999c");
    }
    r(x + 2, y + h - 12, w - 4, 2, "#bf8569");
    r(x + 2, y + h - 6, w - 4, 3, "#334459");
    r(x + w - 11, y + 7, 8, 13, "#32485d");
    r(x + w - 5, y + h - 12, 5, 2, "#f5d0a1");
    r(x, y + h - 12, 3, 2, "#d78979");
    r(x + 10, y - 10, 1, 10, "#65778a");
    r(x + 6, y - 11, 10, 1, "#65778a");
    for (const wx of [x + 8, x + w - 18]) {
      r(wx, y + h - 5, 10, 5, "#1d2639");
      r(wx + 2, y + h - 4, 6, 1, "#718597");
    }
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
  r(X(-5, 3), y - 14, 3, 2, "#9a948c"); // pot lid cheek
  r(X(-5, 2), y - 14, 2, 1, "#c9c3ba");
  r(X(-8, 3), y - 10, 3, 4, "#e05a45"); // toy arm
  r(X(-8, 3), y - 7, 3, 2, "#4d7a9c");
  r(X(6, 1), y - 14, 1, 4, "#6f9a5a"); // sprout
  r(X(7, 2), y - 14, 2, 2, "#8fbf6a");
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

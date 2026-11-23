import { type Game } from "../game/simulation";
import { at, hardness, rng, surface } from "../game/world";
import {
  android,
  brush,
  glow,
  iconColors,
  itemArt,
  S,
  sprite,
  type Brush,
} from "./pixels";
import { terrainLayer } from "./terrain";
import { annex } from "./fixtures";

const plate = new Image();
plate.src = "/art/hollow.jpg";
const cabin = new Image();
cabin.src = "/art/sanctuary.png";
export function scene(g: Game) {
  const ground = terrainLayer(g.world, g.seed),
    rand = rng(g.seed);
  const motes = Array.from({ length: 85 }, () => ({
    x: rand(),
    y: rand(),
    phase: rand() * 6.28,
    speed: 0.2 + rand() * 0.45,
  }));
  let cx = g.x,
    cy = g.y,
    lastImpact = -1,
    opened = false,
    first = true;
  function draw(c: Brush, reduced: boolean) {
    const { width: w, height: h } = c.canvas,
      r = brush(c),
      t = g.ticks;
    // Keep the contact tile in view, including at boundaries and on narrow screens.
    const halfW = w / (2 * S),
      halfH = h / (2 * S);
    const homeBias = Math.max(0, 1 - Math.hypot(g.x - 17.5, g.y - 11.45) / 7);
    const look = c.canvas.clientWidth <= 700 ? -2.9 * homeBias : 1;
    const targetX = Math.max(halfW, Math.min(g.world.w - halfW, g.x + look));
    const targetY = Math.max(
      halfH,
      Math.min(g.world.h - halfH, g.y - halfH * 0.19),
    );
    const follow = first || reduced ? 1 : 0.15;
    cx += (targetX - cx) * follow;
    cy += (targetY - cy) * follow;
    first = false;
    const ox = Math.round(w / 2 - cx * S),
      oy = Math.round(h / 2 - cy * S);
    c.fillStyle = "#1e4748";
    c.fillRect(0, 0, w, h);
    if (plate.complete && plate.naturalWidth) {
      const scale =
        Math.max(w / plate.naturalWidth, h / plate.naturalHeight) * 1.12;
      const dw = plate.naturalWidth * scale,
        dh = plate.naturalHeight * scale;
      const bx = (w - dw) * (0.42 + 0.25 * Math.sin((cx - 17) * 0.035)),
        by = (h - dh) * (0.4 + 0.35 * Math.sin(cy * 0.05));
      c.drawImage(
        plate,
        Math.floor(bx),
        Math.floor(by),
        Math.ceil(dw),
        Math.ceil(dh),
      );
      r(0, 0, w, h, "rgba(11,32,35,.24)");
    }
    c.save();
    c.translate(ox, oy);
    // Tunnels reveal the dim back wall of the same rock, below the gallery.
    for (
      let x = Math.max(0, Math.floor(-ox / S));
      x < Math.min(g.world.w, (w - ox) / S);
      x++
    ) {
      const sy = surface(x) * S;
      r(x * S, sy, S, g.world.h * S - sy, "#18292c");
      for (let y = sy + 3; y < Math.min(g.world.h * S, h - oy); y += 8) {
        const n = Math.sin(x * 41 + y * 7);
        r(x * S + 6 + n * 5, y, 7 + n * 4, 1, "#213336");
        r(x * S + 11 - n * 5, y + 4, 3, 1, "#263638");
      }
    }
    const hit = g.impact;
    if (hit && lastImpact !== hit.tick) {
      ground.update(hit.x, hit.y);
      lastImpact = hit.tick;
    }
    if (opened !== g.panelOpen) {
      ground.update(g.world.annex.x, g.world.annex.y);
      opened = g.panelOpen;
    }
    c.drawImage(ground.image, 0, 0);
    glow(c, 12.6 * S, 10.8 * S, 83, "241,169,84", 0.17);
    if (cabin.complete && cabin.naturalWidth)
      c.drawImage(cabin, 7.45 * S, 12 * S - 87, 190, 91);
    glow(c, 15.8 * S, 10.8 * S, 15, "252,179,85", 0.17);
    if (g.treated) {
      glow(c, 13.1 * S, 10.8 * S, 13, "141,235,176", 0.26);
      r(13.1 * S, 10.8 * S, 6, 1, "#b8eeab");
    }
    annex(c, g, reduced ? 0 : t);
    for (const drop of g.world.drops) {
      const bloom = drop.item === "bloom",
        x = drop.x * S,
        y = drop.y * S;
      const bob = reduced ? 0 : Math.sin(t * 0.045 + x) * 1.3;
      glow(
        c,
        x,
        y,
        bloom ? 27 : 12,
        bloom ? "196,150,240" : "182,209,183",
        bloom ? 0.27 : 0.13,
      );
      sprite(r, x - 6, y - 6 + bob, itemArt[drop.item], iconColors);
      if (bloom) {
        r(x - 8, y - 8 + bob, 1, 3, "#d7bddc");
        r(x - 9, y - 7 + bob, 3, 1, "#d7bddc");
      }
    }
    const age = hit ? t - hit.tick : 99;
    const kick = !reduced && age < 5 ? (5 - age) * 0.48 : 0;
    const px =
      g.x * S + (g.facing === "right" ? kick : g.facing === "left" ? -kick : 0);
    const py =
      g.y * S + (g.facing === "down" ? kick : g.facing === "up" ? -kick : 0);
    glow(c, px, py, 25, "247,213,143", 0.13);
    android(c, px, py, g.facing === "left", t, reduced);
    if (hit && age < 17) {
      const dx = hit.dir === "right" ? 1 : hit.dir === "left" ? -1 : 0,
        dy = hit.dir === "down" ? 1 : hit.dir === "up" ? -1 : 0;
      const ix = (hit.x + 0.5 - dx * 0.44) * S,
        iy = (hit.y + 0.5 - dy * 0.44) * S;
      if (age < 5) {
        r(ix - 2, iy, 5, 1, "#ffdda2");
        r(ix, iy - 2, 1, 5, "#ffdda2");
      }
      if (!reduced)
        for (let i = 0; i < (hit.broken ? 10 : 5); i++) {
          const angle = i * 2.4 + hit.x,
            dist = age * (0.4 + (i % 4) * 0.19);
          r(
            ix + Math.cos(angle) * dist - dx * age * 0.15,
            iy + Math.sin(angle) * dist + age * age * 0.023,
            age < 9 ? 2 : 1,
            1,
            i % 3 ? "#c5ac87" : "#749589",
          );
        }
    }
    if (hit && !hit.broken && age < 20) {
      const target = at(g.world, hit.x, hit.y),
        count = hardness[target.kind];
      const left = (hit.x + 0.5) * S - count * 2,
        top = hit.y * S - 4;
      r(left - 1, top - 1, count * 4 + 1, 4, "#23302c");
      for (let i = 0; i < count; i++)
        r(left + i * 4, top, 3, 2, i < target.hp ? "#ebc793" : "#53615a");
    }
    c.restore();
    for (const p of motes) {
      const x =
        (p.x * w -
          ox * -0.13 +
          Math.sin((reduced ? 0 : t * 0.008) + p.phase) * 3 +
          w * 10) %
        w;
      const y =
        (p.y * h - (reduced ? 0 : t * 0.07) * p.speed + oy * 0.12 + h * 10000) %
        h;
      if (
        at(g.world, Math.floor((x - ox) / S), Math.floor((y - oy) / S)).kind !==
        "empty"
      )
        continue;
      c.globalAlpha = reduced
        ? 0.38
        : 0.18 + 0.4 * (0.5 + 0.5 * Math.sin(t * 0.015 + p.phase));
      r(x, y, 1, 1, "#c4f1c2");
    }
    c.globalAlpha = 1;
    return {
      px: (g.x * S + ox) / w,
      py: (g.y * S + oy) / h,
      homeX: (12.05 * S + ox) / w,
      homeY: (7.55 * S + oy) / h,
    };
  }
  return draw;
}

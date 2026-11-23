export type Material =
  "empty" | "earth" | "stone" | "copper" | "crystal" | "shell";
export type Tile = { kind: Material; hp: number };
export const hardness = {
  empty: 0,
  earth: 1,
  stone: 2,
  copper: 2,
  crystal: 3,
  shell: Infinity,
};
export const tile = (kind: Material): Tile => ({ kind, hp: hardness[kind] });
export type Item = "copper" | "crystal" | "bloom";
export type Drop = { x: number; y: number; item: Item };
export interface World {
  w: number;
  h: number;
  cells: Tile[];
  drops: Drop[];
  bloom: Point;
  annex: Point;
}
export type Point = { x: number; y: number };
export const HOME = { x: 15.5, y: 11.3 };
export function at(w: World, x: number, y: number): Tile {
  return x < 0 || y < 0 || x >= w.w || y >= w.h
    ? tile("shell")
    : w.cells[y * w.w + x];
}
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
export function surface(x: number) {
  if (x < 6) return 11;
  if (x < 19) return 12;
  if (x < 22) return 14;
  if (x < 26) return 16;
  if (x < 30) return 14;
  return Math.round(13 + 2 * Math.sin(x * 0.41));
}
export function generate(seed: number): World {
  const rand = rng(seed),
    w = 72,
    h = 43;
  const cells = Array.from({ length: w * h }, (_, i) => {
    const x = i % w,
      y = Math.floor(i / w),
      r = rand();
    if (!x || !y || x === w - 1 || y === h - 1) return tile("shell");
    if (y < surface(x)) return tile("empty");
    return tile(
      r < 0.055
        ? "crystal"
        : r < 0.14
          ? "copper"
          : r < 0.55
            ? "stone"
            : "earth",
    );
  });
  const set = (x: number, y: number, kind: Material) => {
    cells[y * w + x] = tile(kind);
  };
  // Elliptical pockets overlap into galleries. Author the critical rooms last.
  for (let n = 0; n < 42; n++) {
    const cx = 3 + rand() * (w - 6),
      cy = 17 + rand() * (h - 20),
      rx = 2 + rand() * 5,
      ry = 1 + rand() * 3;
    for (
      let y = Math.max(surface(Math.floor(cx)) + 2, Math.floor(cy - ry));
      y <= Math.min(h - 2, cy + ry);
      y++
    )
      for (
        let x = Math.max(1, Math.floor(cx - rx));
        x <= Math.min(w - 2, cx + rx);
        x++
      )
        if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < 1) set(x, y, "empty");
  }
  for (let x = 8; x <= 16; x++) set(x, 12, "shell");
  for (let x = 8; x <= 10; x++)
    for (let y = 10; y <= 11; y++) set(x, y, "shell");
  set(17, 12, "earth");
  set(18, 12, "copper");
  set(19, 14, "crystal");
  const bloom = { x: 22.5 + Math.floor(rand() * 3), y: 17.5 };
  for (let x = 22; x < 26; x++) {
    set(x, 16, "earth");
    set(x, 17, "empty");
    set(x, 18, "stone");
  }
  const annex = {
    x: 31 + Math.floor(rand() * 4),
    y: 22 + Math.floor(rand() * 3),
  };
  for (let y = annex.y - 3; y <= annex.y + 1; y++)
    for (let x = annex.x; x <= annex.x + 7; x++)
      set(
        x,
        y,
        y === annex.y - 3 ||
          y === annex.y + 1 ||
          x === annex.x ||
          x === annex.x + 7
          ? "shell"
          : "empty",
      );
  for (let x = annex.x - 3; x < annex.x; x++)
    for (let y = annex.y - 2; y <= annex.y; y++) set(x, y, "empty");
  return { w, h, cells, annex, bloom, drops: [{ ...bloom, item: "bloom" }] };
}

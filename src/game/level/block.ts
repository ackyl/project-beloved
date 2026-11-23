import { Grid, type Level } from "./level";

// The block, roughed in for Chunk 1: the walk-up, the street and the scrapyard.
// Hazards arrive in Chunks 2 and 3. The street surface is the top of row 30.
//
//   x  0–21   West street: tram stop shelter, awning
//   x 22–45   The Building: ground-floor flat, floor 2, roof with tank and antenna
//   x 46–75   East street: fire escape, dumpster, noodle cart, vending machine, shack
//   x 76–111  Scrapyard: fence, scrap piles, compactor pit, crane gantry
export const STREET = 30;

export function buildBlock(): Level {
  const g = new Grid(112, 33);
  g.rect(0, STREET, 112, 3, "#");

  // The Building.
  g.rect(23, 19, 22, 5, "w") // floor 2 interior
    .rect(23, 25, 22, 5, "w") // ground-floor flat
    .rect(22, 18, 24, 1, "B") // roof slab
    .rect(22, 24, 24, 1, "B") // floor 2 slab
    .rect(22, 17, 1, 13, "B") // west wall and parapet
    .rect(45, 17, 1, 13, "B") // east wall and parapet
    .rect(22, 27, 1, 3, "w") // west door
    .rect(45, 27, 1, 3, "w") // east door
    .rect(45, 21, 1, 3, "w") // floor 2 door to the fire escape
    .rect(41, 24, 1, 6, "L") // ladder: flat to floor 2
    .rect(25, 18, 1, 6, "L") // ladder: floor 2 to roof
    .rect(30, 21, 4, 1, "_") // bookshelf top on floor 2
    .rect(38, 15, 4, 3, "M") // rooftop water tank
    .rect(43, 8, 1, 10, "H"); // antenna, climbable

  // Fire escape.
  g.rect(46, 24, 3, 1, "=") // balcony off floor 2
    .rect(49, 24, 1, 6, "H") // balcony to street
    .rect(46, 18, 2, 1, "=") // landing at roof level
    .rect(48, 18, 1, 6, "H"); // balcony to landing

  // West street.
  g.rect(8, 27, 6, 1, "=") // tram shelter roof
    .rect(17, 24, 5, 1, "="); // awning

  // East street and the shack.
  g.rect(58, 27, 4, 1, "=") // vending machine awning
    .rect(60, 24, 3, 1, "=") // shack steps
    .rect(63, 22, 10, 8, "B");

  // Scrapyard.
  g.rect(76, 28, 1, 2, "M") // fence
    .rect(80, 27, 6, 3, "M") // scrap pile
    .rect(82, 24, 3, 3, "M")
    .rect(88, STREET, 5, 2, ".") // compactor pit
    .rect(95, 27, 7, 3, "M") // second pile
    .rect(97, 25, 3, 2, "M")
    .rect(96, 16, 12, 1, "=") // crane gantry
    .rect(108, 16, 1, 14, "H") // crane ladder
    .rect(111, 20, 1, 10, "M"); // yard wall

  return {
    name: "The block",
    w: g.w,
    h: g.h,
    rows: g.rows(),
    spawn: { x: 26.5, y: STREET },
    props: [
      { kind: "crate", x: 31, y: STREET },
      { kind: "pot", x: 35, y: 24 },
      { kind: "pot", x: 30, y: 18 },
      { kind: "crate", x: 11, y: 27 },
      { kind: "crate", x: 52.5, y: STREET },
      { kind: "tire", x: 83.5, y: 24 },
      { kind: "crate", x: 98.5, y: 25 },
      { kind: "tire", x: 104, y: STREET },
    ],
    decor: [
      { kind: "replicator", x: 24.6, y: STREET },
      { kind: "deathBoard", x: 34.5, y: 28.2 },
      { kind: "plant", x: 43.6, y: STREET },
      { kind: "plant", x: 28, y: 24 },
      { kind: "sofa", x: 37, y: 24 },
      { kind: "lamp", x: 40, y: 24 },
      { kind: "solar", x: 28.5, y: 18 },
      { kind: "solar", x: 32, y: 18 },
      { kind: "plant", x: 35, y: 18 },
      { kind: "plant", x: 36.2, y: 18 },
      { kind: "antenna", x: 43.5, y: 8 },
      { kind: "laundry", x: 45.6, y: 17.2, x2: 63, y2: 21.6 },
      { kind: "laundry", x: 2, y: 21, x2: 22, y2: 19.5 },
      { kind: "tramSign", x: 5, y: STREET },
      { kind: "streetLamp", x: 16, y: STREET },
      { kind: "dumpster", x: 53.5, y: STREET },
      { kind: "noodleCart", x: 56.2, y: STREET },
      { kind: "vending", x: 60, y: STREET },
      { kind: "streetLamp", x: 74, y: STREET },
      { kind: "compactor", x: 90.5, y: STREET + 2 },
      { kind: "crane", x: 108.5, y: STREET, x2: 100, y2: 16 },
    ],
  };
}

export const assays = {
  resonance: {
    name: "Resonance test",
    action: "Sound a tuning fork",
    result:
      "The petals repeat the fork’s pitch. Three pulses follow each note.",
  },
  repair: {
    name: "Membrane test",
    action: "Touch a torn test film",
    result:
      "The split in the film draws closed. The surrounding fibers stay supple.",
  },
} as const;
export type TestId = keyof typeof assays;
export const formulas = {
  sedative: "Damping salve",
  support: "Resonant breathing support",
  seal: "Rigid sealant",
} as const;
export type Formula = keyof typeof formulas;
export type BaseCommand =
  | { type: "test"; id: TestId }
  | { type: "deduce"; id: Formula }
  | { type: "craft" }
  | { type: "care" }
  | { type: "upgrade" }
  | { type: "stow" };
export function researchState() {
  return {
    tests: { resonance: false, repair: false },
    learned: false,
    prepared: false,
    treated: false,
    revealed: false,
    careAge: 0,
    upgraded: false,
    stores: { copper: 0, crystal: 0 },
    feedback: "",
  };
}

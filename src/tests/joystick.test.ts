import { expect, it } from "vitest";
import { joystickDirections } from "../platform/joystick";

it("ignores touches near the center", () => {
  expect(joystickDirections(0, 0)).toEqual([]);
  expect(joystickDirections(0.1, -0.15)).toEqual([]);
});

it("keeps a slightly tilted horizontal drag from jumping", () => {
  expect(joystickDirections(0.8, -0.3)).toEqual(["right"]);
  expect(joystickDirections(-0.8, 0.3)).toEqual(["left"]);
});

it("allows straight climbs, drops and deliberate diagonal jumps", () => {
  expect(joystickDirections(0.2, -1)).toEqual(["up"]);
  expect(joystickDirections(0, 0.9)).toEqual(["down"]);
  expect(joystickDirections(-1, -1)).toEqual(["left", "up"]);
  expect(joystickDirections(0.7, 0.7)).toEqual(["right", "down"]);
});

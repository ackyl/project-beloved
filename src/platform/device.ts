// Decides whether to show the game or the desktop-only screen.
export type DeviceEnv = {
  /** `(pointer: coarse)` matches. */
  coarse: boolean;
  /** `(hover: hover)` matches. */
  hover: boolean;
  /** Viewport width in CSS pixels. */
  width: number;
  /** The visitor chose to try anyway, or the URL has `?desktop=1`. */
  override: boolean;
};

export const MIN_DESKTOP_WIDTH = 720;

export function isDesktop(env: DeviceEnv) {
  if (env.override) return true;
  if (env.coarse && !env.hover) return false;
  return env.width >= MIN_DESKTOP_WIDTH;
}

const OVERRIDE_KEY = "project-beloved/desktop-override";

export function readDevice(): DeviceEnv {
  let override = new URLSearchParams(location.search).get("desktop") === "1";
  try {
    override ||= sessionStorage.getItem(OVERRIDE_KEY) === "1";
  } catch {
    // Storage can be unavailable. The override then lasts for this page only.
  }
  return {
    coarse: matchMedia("(pointer: coarse)").matches,
    hover: matchMedia("(hover: hover)").matches,
    width: window.innerWidth,
    override,
  };
}

export function rememberOverride() {
  try {
    sessionStorage.setItem(OVERRIDE_KEY, "1");
  } catch {
    // Ignore unavailable storage.
  }
}

import type { Store } from "../game/save";

const GUIDE_KEY = "project-beloved/guide-seen";

export function hasSeenGuide(store: Store | null) {
  try {
    return store?.getItem(GUIDE_KEY) === "1";
  } catch {
    return false;
  }
}

export function rememberGuide(store: Store | null) {
  try {
    store?.setItem(GUIDE_KEY, "1");
  } catch {
    // The guide is still dismissible when browser storage is unavailable.
  }
}

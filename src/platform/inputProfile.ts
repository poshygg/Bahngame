import { Platform } from "react-native";
import type { InputProfile } from "../data/stages";

/** App targets choose their rules once; resizing a window never changes a run. */
export function detectInputProfile(): InputProfile {
  if (Platform.OS !== "web") return "touch";
  if (typeof navigator === "undefined") return "keyboard";
  if (/Electron\//i.test(navigator.userAgent)) return "keyboard";
  return navigator.maxTouchPoints > 0 &&
    typeof matchMedia !== "undefined" &&
    matchMedia("(pointer: coarse)").matches
    ? "touch"
    : "keyboard";
}

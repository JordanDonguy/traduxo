import { Platform } from "@traduxo/packages/types/platform";

/**
 * Blur the active input element (web) or dismiss keyboard (React Native)
 * Reads platform from process.env.PLATFORM
 * @param keyboardModule Optional React Native Keyboard module for RN
 */
export function blurActiveInput(keyboardModule?: { dismiss: () => void }): void {
  const platform = process.env.PLATFORM as Platform;
  if (!platform) return; // exit if platform not set

  if (platform === "react-native") {
    if (keyboardModule) {
      keyboardModule.dismiss();
    } else {
      console.warn("RN Keyboard module not provided. Cannot dismiss keyboard.");
    }
    return;
  }

  // Web branch
  /* istanbul ignore else */
  if (platform === "web") {
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    } else {
      console.warn("Document is not defined, can't blur input.");
    }
  } return;
}

import { Platform } from "@traduxo/packages/types/platform";

/**
 * Blur the active input element (web) or dismiss keyboard (React Native)
 * Reads platform from process.env.PLATFORM in React Native or NEXT_PUBLIC_PLATFORM in nextjs
 * @param keyboardModule Optional React Native Keyboard module for RN
 */
export function blurActiveInput(keyboardModule?: { dismiss: () => void }): void {
  const platform =
    (process.env.NEXT_PUBLIC_PLATFORM as Platform) ||
    (process.env.PLATFORM as Platform);

  // Exit if platform not set
  if (!platform) {
    console.warn("Platform not set");
    return;
  }

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

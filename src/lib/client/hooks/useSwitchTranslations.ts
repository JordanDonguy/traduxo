"use client";

import { useState, useCallback } from "react";
import { swapMainTranslation } from "../utils/swapMainTranslation";

type UseSwitchTranslationsArgs = {
  setTranslatedText: React.Dispatch<React.SetStateAction<string[]>>;
  timeoutFn?: typeof setTimeout; // injectable for tests
};

export function useSwitchTranslations({
  setTranslatedText,
  timeoutFn = setTimeout,
}: UseSwitchTranslationsArgs) {
  // ---- Step 1: Initialize state ----
  // fading: stores indices of translations currently undergoing a fade animation
  const [fading, setFading] = useState<number[]>([]);

  // ---- Step 2: Define the switchTranslations function ----
  const switchTranslations = useCallback(
    (idx: number) => {
      const altIdx = idx + 2; // Calculate the index in the alternatives array
      setFading([1, altIdx]); // Start fading effect on the main and selected alt translation

      // ---- Step 2a: Swap main translation with selected alternative after fade ----
      timeoutFn(() => {
        setTranslatedText((prev) => swapMainTranslation(prev, altIdx));
        setFading([]); // Reset fading state after swap
      }, 200); // Wait 200ms to allow fade animation to complete
    },
    [setTranslatedText, timeoutFn]
  );

  // ---- Step 3: Return state and handler ----
  return { fading, switchTranslations };
}

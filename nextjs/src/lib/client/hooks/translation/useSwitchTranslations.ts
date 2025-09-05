"use client";

import { useState, useCallback } from "react";
import { swapMainTranslation } from "../../utils/translation/swapMainTranslation";
import { TranslationItem } from "@traduxo/packages/types/translation";

type UseSwitchTranslationsArgs = {
  translatedText: TranslationItem[];
  setTranslatedText: React.Dispatch<React.SetStateAction<TranslationItem[]>>;
  timeoutFn?: typeof setTimeout; // injectable for tests
};

export function useSwitchTranslations({
  translatedText,
  setTranslatedText,
  timeoutFn = setTimeout,
}: UseSwitchTranslationsArgs) {
  // ---- Step 1: Initialize state ----
  // fading: stores indices of translations currently undergoing a fade animation
  const [fading, setFading] = useState<string[]>([]);

  // ---- Step 2: Define the switchTranslations function ----
  const switchTranslations = useCallback(
    (alt: string) => {
      const mainTranslation = translatedText.find(t => t.type === "main_translation")
      if (!mainTranslation || !alt) return;
      setFading([mainTranslation.value, alt]);  // Start fading effect on the main and selected alt translation

      // ---- Step 2a: Swap main translation with selected alternative after fade ----
      timeoutFn(() => {
        setTranslatedText((prev) => swapMainTranslation(prev, mainTranslation.value, alt));
        setFading([]); // Reset fading state after swap
      }, 200); // Wait 200ms to allow fade animation to complete
    },
    [translatedText, setTranslatedText, timeoutFn]
  );

  // ---- Step 3: Return state and handler ----
  return { fading, switchTranslations };
}

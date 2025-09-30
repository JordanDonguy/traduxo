import { useState, useRef, useEffect } from "react";

type UseLanguageSwitchProps = {
  inputLang: string;                     // Current input language selected by the user
  outputLang: string;                    // Current output language selected by the user
  setInputLang: (lang: string) => void;  // Function to update input language
  setOutputLang: (lang: string) => void; // Function to update output language
  detectedLang: string;                  // Detected language if inputLang is set to "auto"
  timeoutFn?: typeof setTimeout;         // Injected timeout function for testing
};

export function useLanguageSwitch({
  inputLang,
  outputLang,
  setInputLang,
  setOutputLang,
  detectedLang,
  timeoutFn = setTimeout,
}: UseLanguageSwitchProps) {

  // ---- Step 1: Initialize state ----
  // isSwitching: whether the language switching animation is active
  const [isSwitching, setIsSwitching] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---- Step 2: Define the language switch function ----
  const switchLanguage = () => {
    setIsSwitching(true);  // Start the switching animation

    // Swap input/output languages
    const temp = outputLang;
    if (inputLang === "auto") {
      // If inputLang is "auto", use detected language or fallback as output
      if (detectedLang !== outputLang) {
      setOutputLang(detectedLang);
      } else if (outputLang !== "en") {
        setOutputLang("en"); // Fallback to English
      } else {
        setOutputLang("fr"); // If output was English, fallback to French
      };
    } else {
      setOutputLang(inputLang);
    }
    setInputLang(temp);
  };

  // ---- Step 3: Reset switching state after animation ----
  useEffect(() => {
    if (!isSwitching) return;

    timeoutRef.current = timeoutFn(() => {
      setIsSwitching(false); // End animation after 80ms
    }, 80);

    // Cleanup timeout on unmount or when isSwitching changes
    return () => {
      /* istanbul ignore else */
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isSwitching, timeoutFn]);

  // ---- Step 4: Return state and handler ----
  return { isSwitching, switchLanguage };
}

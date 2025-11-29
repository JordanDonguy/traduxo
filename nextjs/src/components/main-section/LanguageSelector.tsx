"use client";

import { useEffect, useMemo, useState } from "react";
import { TranslationItem } from "@traduxo/packages/types/translation";
import { useTheme } from "next-themes";
import ISO6391 from "iso-639-1";
import { ArrowRightLeft } from "lucide-react";

type LanguageSelectorProps = {
  inputLang: string;
  outputLang: string;
  setInputLang: (lang: string) => void;
  setOutputLang: (lang: string) => void;
  isSwitching: boolean;
  switchLanguage: () => void;
  setShowWarning?: (val: boolean) => void;
  inputTextLang: string,
  handleTranslate: (text: string) => void;
  translatedText: TranslationItem[];
};

export default function LanguageSelector({
  inputLang,
  outputLang,
  setInputLang,
  setOutputLang,
  isSwitching,
  switchLanguage,
  setShowWarning,
  inputTextLang,
  handleTranslate,
  translatedText
}: LanguageSelectorProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const languageCodes = ISO6391.getAllCodes();
  const mainTranslation = useMemo(() => translatedText.find(item => item.type === "main_translation")?.value ?? "", [translatedText]);

  // Call translation handler with translated text when switching language (to switch translation)
  useEffect(() => {
    if (isSwitching && mainTranslation) handleTranslate(mainTranslation)
  }, [isSwitching, mainTranslation, handleTranslate]);

  // To avoid hydration issues for resolvedTheme
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="relative w-full grid grid-cols-2 shadow-md rounded-2xl">

      {/* Input language */}
      <select
        id="input-lang-select"
        aria-label="Select input language"
        data-testid="input-lang-select"
        value={inputLang}
        onChange={(e) => setInputLang(e.target.value)}
        onClick={() => setShowWarning && setShowWarning(false)}
        className={`appearance-none h-12 text-center rounded-l-xl !text-[var(--text)] font-semibold bg-[var(--bg-3)]
          hover-1 focus:outline-none border-y border-[var(--gray-1)] ${mounted && (resolvedTheme !== "dark" && "border")}`}
      >
        <option value="auto">
          ✨ Auto {inputLang === "auto" && inputTextLang ? ` (${inputTextLang})` : ""}
        </option>

        {languageCodes.map(code => (
          <option key={code} value={code}>
            {ISO6391.getName(code) || code}
          </option>
        ))}
      </select>

      {/* Invert button */}
      <button
        id="switch-languages-button"
        aria-label="Switch input and output languages"
        onClick={switchLanguage}
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
          w-12 h-12 flex justify-center items-center rounded-full bg-[var(--bg)] backdrop-blur-lg text-[var(--gray-6)]
          z-20 border border-[var(--gray-2)]/50 hover:border-[var(--gray-5)] shadow-sm
          ${isSwitching ? "scale-once hover:bg-[var(--bg)]" : "hover-1 hover:text-[var(--text)]"}`}
      >
        <ArrowRightLeft className={`filter invert-15 ${isSwitching ? "spin-once" : ""}`} />
      </button>

      {/* Output language */}
      <select
        id="output-lang-select"
        aria-label="Select output language"
        data-testid="output-lang-select"
        value={outputLang}
        onChange={(e) => setOutputLang(e.target.value)}
        className={`appearance-none bg-[var(--bg-2)] hover-1 h-12 rounded-r-xl text-center hover-1 focus:outline-none
          !text-[var(--text)] font-semibold border-y border-[var(--gray-2)]/40 ${mounted && (resolvedTheme !== "dark" && "border")}`}
      >
        {languageCodes.map(code => (
          <option key={code} value={code}>
            {ISO6391.getName(code) || code}
          </option>
        ))}
      </select>
    </section>
  );
}

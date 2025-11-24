"use client";

import ISO6391 from "iso-639-1";
import { ArrowRightLeft } from "lucide-react";

type LanguageSelectorProps = {
  inputLang: string;
  outputLang: string;
  setInputLang: (lang: string) => void;
  setOutputLang: (lang: string) => void;
  isSwitching: boolean;
  switchLanguage: () => void;
  showWarning?: boolean;
  setShowWarning?: (val: boolean) => void;
  inputTextLang: string
};

export default function LanguageSelector({
  inputLang,
  outputLang,
  setInputLang,
  setOutputLang,
  isSwitching,
  switchLanguage,
  showWarning = false,
  setShowWarning,
  inputTextLang
}: LanguageSelectorProps) {
  const languageCodes = ISO6391.getAllCodes();

  return (
    <section className="relative w-full grid grid-cols-2 border border-zinc-500 rounded-lg">
      {/* Voice warning */}
      <div className={`${showWarning ? "scale-y-100 opacity-95" : "scale-y-0 opacity-0"} h-60 absolute bottom-37 md:left-28 p-2 bg-warning flex drop-shadow-lg duration-300 origin-bottom`}>
        <span className="max-w-40 block ml-8 mt-8 text-lg">You need to select a language to use voice input</span>
      </div>

      {/* Input language */}
      <select
        id="input-lang-select"
        aria-label="Select input language"
        data-testid="input-lang-select"
        value={inputLang}
        onChange={(e) => setInputLang(e.target.value)}
        onClick={() => setShowWarning && setShowWarning(false)}
        className={`appearance-none h-12 text-center rounded-l-lg
        hover:cursor-pointer hover:bg-[var(--hover)] focus:outline-none duration-100 origin-right ease-in-out`}
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
          w-12 h-12 flex justify-center items-center rounded-full bg-[var(--bg)]
          hover:cursor-pointer hover:bg-[var(--hover)] z-20 border border-zinc-500
          ${isSwitching ? "scale-once" : ""}`}
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
        className={`appearance-none bg-[var(--bg-2)] h-12 rounded-r-lg text-center
          hover:cursor-pointer hover:bg-[var(--hover)] focus:outline-none duration-100 origin-left ease-in-out`}
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

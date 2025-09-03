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
  showWarning: boolean;
  setShowWarning: (val: boolean) => void;
};

export default function LanguageSelector({
  inputLang,
  outputLang,
  setInputLang,
  setOutputLang,
  isSwitching,
  switchLanguage,
  showWarning,
  setShowWarning
}: LanguageSelectorProps) {
  const languageCodes = ISO6391.getAllCodes();

  return (
    <section className="w-[90%] h-1/2 flex justify-between items-center">
      {/* Voice warning */}
      <div className={`${showWarning ? "scale-y-100 opacity-95" : "scale-y-0 opacity-0"} h-60 absolute bottom-35 md:bottom-40 md:left-28 p-2 bg-warning flex drop-shadow-lg duration-300 origin-bottom`}>
        <span className="max-w-40 block ml-8 mt-8 text-lg">You need to select a language to use voice input</span>
      </div>

      {/* Input language */}
      <select
        data-testid="input-lang-select"
        value={inputLang}
        onChange={(e) => setInputLang(e.target.value)}
        onClick={() => setShowWarning(false)}
        className={`appearance-none w-2/5 bg-[var(--input)] h-12 rounded-2xl text-center
        hover:cursor-pointer hover:bg-[var(--hover)] focus:outline-none duration-100 origin-right ease-in-out
        ${isSwitching ? "translate-x-full pointer-events-none" : "translate-x-0 opacity-100"}`}
      >
        <option value="auto">✨ Auto</option>
        {languageCodes.map(code => (
          <option key={code} value={code}>
            {ISO6391.getName(code) || code}
          </option>
        ))}
      </select>

      {/* Invert button */}
      <button
        onClick={switchLanguage}
        className="w-12 h-12 flex justify-center items-center hover:cursor-pointer hover:bg-[var(--hover)] rounded-full"
      >
        <ArrowRightLeft className="filter invert-15" />
      </button>

      {/* Output language */}
      <select
        data-testid="output-lang-select"
        value={outputLang}
        onChange={(e) => setOutputLang(e.target.value)}
        className={`appearance-none w-2/5 bg-[var(--input)] h-12 rounded-2xl text-center
        hover:cursor-pointer hover:bg-[var(--hover)] focus:outline-none duration-100 origin-left ease-in-out
        ${isSwitching ? "-translate-x-full pointer-events-none" : "translate-x-0 opacity-100"}`}
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

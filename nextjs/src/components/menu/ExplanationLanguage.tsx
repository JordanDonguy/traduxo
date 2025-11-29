"use client"

import { useExplanationLanguage } from "@traduxo/packages/hooks/explanation/useExplanationLanguage";
import { getSortedLanguageCodes } from "@traduxo/packages/utils/language/sortedLanguageCodes";
import { Check } from "lucide-react";
import ISO6391 from "iso-639-1";

interface ExplanationLanguageProps {
  showMenu: boolean
}

function ExplanationLanguage({ showMenu }: ExplanationLanguageProps) {
  const { systemLang, changeSystemLang } = useExplanationLanguage({});

  return (
    <div
      className={`
        w-full mx-auto flex flex-col text-[var(--text-color)]
        ${showMenu ? "opacity-100" : "opacity-0"} duration-200
        `}>
      <div className="flex flex-col gap-6">

        <h1 className="text-2xl text-center font-medium">Explanation Language</h1>

        <div className="flex flex-col gap-6 overflow-y-auto max-h-[calc(100dvh-8rem)] pb-8 scrollbar-hide">

          {getSortedLanguageCodes().map(code => (
            <article
              id={`explanation-language-option code ${code}`}
              aria-label={`Select explanation language code ${code}`}
              key={code}
              onClick={() => {
                changeSystemLang(code);
              }}
              className={`relative w-full flex items-center gap-2 md:gap-4 bg-[var(--bg-2)]/70 rounded-2xl p-2 md:p-4 h-16 shrink-0
                border hover:border-[var(--blue-1)] hover:cursor-pointer shadow-md
                ${systemLang === code ? "border-[var(--gray-4)]" : "border-[var(--gray-3)]"}`}
            >
              {systemLang === code ? (
                <Check className="absolute right-6 rounded-full border p-0.5 text-[var(--blue-1)]" />
              ) : null}
              <span className="w-full flex items-center justify-center text-lg">
                {ISO6391.getName(code) || code} ({code.toUpperCase()})
              </span>
            </article>
          ))}

        </div>
      </div>
    </div>
  )
}

export default ExplanationLanguage

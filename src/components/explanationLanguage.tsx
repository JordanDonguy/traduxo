"use client"

import { useLanguageContext } from "@/context/LanguageContext";
import { useSession } from "next-auth/react";
import { Check } from "lucide-react";
import ISO6391 from "iso-639-1";
import { sortedLanguageCodes } from "@/lib/client/utils/sortedLanguageCodes";

type ExplanationLanguageProps = {
  showMenu: boolean;
}

function ExplanationLanguage({ showMenu }: ExplanationLanguageProps) {
  const { systemLang, setSystemLang } = useLanguageContext();
  const { status } = useSession();

  // Update system language state and save it to db if user logged in
  async function changeSystemLang(code: string) {
    setSystemLang(code);
    if (status === "authenticated") {
      await fetch("/api/auth/update-language", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ code })
      })
    }
  };

  return (
    <div
      className={`
        max-w-2xl w-full mx-auto flex flex-col text-[var(--text-color)]
        ${showMenu ? "opacity-100" : "opacity-0"} duration-200
        `}>
      <div className="flex flex-col gap-6">

        <h1 className="text-2xl text-center font-bold">Explanation Language</h1>

          <div className="flex flex-col gap-4 md:gap-6 overflow-y-auto max-h-[calc(100dvh-8rem)] pb-8 scrollbar-hide">

            {sortedLanguageCodes.map(code => (
              <article
                key={code}
                onClick={() => {
                  changeSystemLang(code);
                }}
                className="
              relative w-full flex flex-col gap-2 md:gap-4 bg-[var(--bg-2)] rounded-md p-2 md:p-4
              border border-transparent hover:border-[var(--input-placeholder)] hover:cursor-pointer
              "
              >
                {systemLang === code ? (
                  <Check className="absolute right-6 rounded-full border p-0.5" />
                ) : null}
                <span className="w-full flex items-center justify-center">
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

"use client"

import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { useTranslationContext } from "@/context/TranslationContext";
import { useLanguageContext } from "@/context/LanguageContext";
import getSuggestionLanguage from "@/lib/client/utils/getSuggestionLanguage";
import { suggestExpressionHelper } from "@/lib/client/utils/suggestExpression";
import { fetchExpressionPoolHelper } from "@/lib/client/utils/fetchExpressionPool";
import { useSession } from "next-auth/react";
import { useWaitForAuthStatus } from "@/lib/client/hooks/useWaitForAuthStatus";
import { Dices, Languages } from "lucide-react";

function LandingDisplay() {
  const { setIsLoading, setError } = useApp();

  const {
    setTranslatedText,
    setInputTextLang,
    setTranslatedTextLang,
    setExplanation,
    setIsFavorite,
    setTranslationId,
    expressionPool,
    setExpressionPool,
  } = useTranslationContext();

  const { detectedLang, outputLang } = useLanguageContext();

  const { status } = useSession();
  const { waitForStatus } = useWaitForAuthStatus();

  const [showWarning, setShowWarning] = useState<boolean>(false);

  // Suggest and expression on main view
  async function suggestExpression() {
    // If in "auto" inputLang, check if detectedLang = outputLang and uses a fallback if it is
    const suggestionLang = getSuggestionLanguage(detectedLang, outputLang);

    setIsLoading(true);   // Trigger loading animation

    // Wait for session status to be defined (authenticated or not)
    await waitForStatus();

    if (!expressionPool.length) {
      const promises = [
        suggestExpressionHelper({
          detectedLang: suggestionLang,
          outputLang,
          setTranslatedText,
          setInputTextLang,
          setTranslatedTextLang,
          setExplanation,
          setError,
          setIsLoading,
          setIsFavorite,
          setTranslationId,
        }),
      ];

      if (status === "authenticated") {
        promises.push(
          fetchExpressionPoolHelper({
            setError,
            suggestionLang,
            setExpressionPool,
          })
        );
      }

      await Promise.all(promises);
      return;
    }
  };

  // Focus translation input
  function focusInput() {
    const input = document.querySelector("input");
    if (input) {
      input.focus();
    }
    if (window.innerWidth > 768) {
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 4000);
      return;
    }
  }

  return (
    <div className="relative text-center w-full max-w-[96%] sm:max-w-xl lg:max-w-3xl flex flex-col gap-12 items-center mt-10">
      <h2 className="text-4xl max-w-[85%]">What can I do for you today?</h2>

      {/* Display message to user to enter input text */}
      <div className={`${showWarning ? "scale-y-100 opacity-95" : "scale-y-0 opacity-0"}
        h-60 fixed bottom-20 lg:bottom-28 max-w-xl lg:max-w-2xl p-2 bg-warning z-30
        flex drop-shadow-lg duration-300 origin-bottom`}
      >
        <span className="max-w-40 block ml-8 mt-8 text-lg">Please enter some text here and press enter key</span>
      </div>

      {/* Suggest expression button */}
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-4 w-full max-w-[85%]">
        <button
          onClick={suggestExpression}
          className="flex justify-center items-center rounded-full border w-full py-4 gap-4 border-[var(--border)]
          hover:cursor-pointer hover:bg-[var(--bg-2)] active:scale-85 duration-100"
        >
          <Dices />
          <p className="text-xl">Suggest an expression</p>
        </button>

        {/* Translation input focus button */}
        <button
          onClick={focusInput}
          className="flex justify-center items-center rounded-full border w-full py-4 gap-4 border-[var(--border)]
          hover:cursor-pointer hover:bg-[var(--bg-2)] active:scale-85 duration-100"
        >
          <Languages />
          <p className="text-xl">Translate something</p>
        </button>
      </div>
    </div>
  )
}

export default LandingDisplay

"use client"

import { useState } from "react";
import UserMenu from "./UserMenu";
import { useLanguageContext } from "@/context/LanguageContext";
import { useTranslationContext } from "@/context/TranslationContext";
import { translationHelper } from "@/lib/client/utils/translate";
import { suggestExpressionHelper } from "@/lib/client/utils/suggestExpression";
import { fetchExpressionPoolHelper } from "@/lib/client/utils/fetchExpressionPool";
import { useSession } from "next-auth/react";
import getSuggestionLanguage from "@/lib/client/utils/getSuggestionLanguage";
import { User, Dices } from "lucide-react";
import Logo from "./Logo";

function AppHeader() {
  const {
    setInputText,
    setTranslatedText,
    setInputTextLang,
    setTranslatedTextLang,
    setExplanation,
    setIsLoading,
    setIsFavorite,
    setTranslationId,
    setError,
    expressionPool,
    setExpressionPool,
    translationHistory,
  } = useTranslationContext();

  const {
    outputLang,
    detectedLang
  } = useLanguageContext();

  const { status } = useSession();

  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [isRolling, setIsRolling] = useState<boolean>(false);   // To trigger dices rolling animation (on click)

  async function suggestTranslation() {
    
    setIsRolling(true);
    setTimeout(() => setIsRolling(false), 600); // animation
    
    setShowMenu(false);
    
    // If in "auto" inputLang, check if detectedLang = outputLang and uses a fallback if it is
    const suggestionLang = getSuggestionLanguage(detectedLang, outputLang);

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

    // Find first expression NOT in history
    const newExpression = expressionPool.find(
      (expression) => !translationHistory.some(t => t.inputText.toLowerCase() === expression.toLowerCase())
    );

    if (!newExpression) {
      // No new expressions left, clear pool and try again
      setExpressionPool([]);
      await suggestTranslation();
      return;
    }

    // Request translation for the new expression
    await translationHelper({
      inputText: newExpression,
      inputLang: suggestionLang,
      outputLang,
      setInputText,
      setInputTextLang,
      setTranslatedTextLang,
      setTranslatedText,
      setExplanation,
      setIsLoading,
      setIsFavorite,
      setTranslationId,
      setError,
    });

    // Remove the used expression from pool to avoid repeating
    setExpressionPool(prev => prev.filter(expr => expr !== newExpression));
  }


  return (
    <header className="w-full h-full flex justify-center">

      <UserMenu showMenu={showMenu} setShowMenu={setShowMenu} />

      <div className="z-30 fixed w-full max-w-6xl h-12 bg-[var(--bg-2)] rounded-b-4xl shadow-sm flex flex-row-reverse md:flex-row items-center justify-between px-4 xl:pl-8 xl:pr-6">
        <button
          onClick={suggestTranslation}
          className="md:hidden p-2 rounded-full hover:bg-[var(--hover)] hover:cursor-pointer"
        >
          <Dices className={`${isRolling ? "animate-dice-roll" : ""}`} />
        </button>

        <Logo />

        <div>
          <button
            onClick={suggestTranslation}
            className="hidden md:inline p-2 rounded-full hover:bg-[var(--hover)] hover:cursor-pointer text-[var(--text)]"
          >
            <Dices className={`${isRolling ? "animate-dice-roll" : ""}`} />
          </button>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-full hover:bg-[var(--hover)] hover:cursor-pointer text-[var(--text)]"
          >
            <User />
          </button>
        </div>
      </div>
    </header>
  )
}

export default AppHeader
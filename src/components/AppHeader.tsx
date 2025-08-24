"use client"

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { User, Dices } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useTranslationContext } from "@/context/TranslationContext";
import { useLanguageContext } from "@/context/LanguageContext";
import { useWaitForAuthStatus } from "@/lib/client/hooks/useWaitForAuthStatus";
import { translationHelper } from "@/lib/client/utils/translate";
import { suggestExpressionHelper } from "@/lib/client/utils/suggestExpression";
import { fetchExpressionPoolHelper } from "@/lib/client/utils/fetchExpressionPool";
import getSuggestionLanguage from "@/lib/client/utils/getSuggestionLanguage";
import UserMenu from "./UserMenu";
import Logo from "./Logo";


function AppHeader() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const submenu = searchParams.get("submenu"); // "login", "history", etc.;

  const { setIsLoading, setError } = useApp();

  const {
    setInputText,
    setTranslatedText,
    setInputTextLang,
    setTranslatedTextLang,
    setExplanation,
    setIsFavorite,
    setTranslationId,
    expressionPool,
    setExpressionPool,
    translationHistory,
  } = useTranslationContext();

  const {
    outputLang,
    detectedLang
  } = useLanguageContext();

  const { status } = useSession();
  const { waitForStatus } = useWaitForAuthStatus();  // A function that resolve a promise once session status is set

  const [isRolling, setIsRolling] = useState<boolean>(false);   // To trigger dices rolling animation (on click)

  // --------- Suggest expression function ---------
  async function suggestTranslation() {

    setIsRolling(true);
    setTimeout(() => setIsRolling(false), 600); // animation

    router.push("/");

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
  };

  // -------- Menu opening / closing section --------
  const [showMenu, setShowMenu] = useState<boolean>(searchParams.get("menu") === "open");
  // Sync state with URL when it changes (back/forward)
  useEffect(() => {
    const menuOpen = searchParams.get("menu") === "open";
    if (menuOpen !== showMenu) setShowMenu(menuOpen);
  }, [showMenu, searchParams]);

  // If the menu is open but no submenu is active, close the menu on back
  // -> Prevents the double-back issue where the menu would otherwise require two back presses to close
  useEffect(() => {
    const handlePopState = () => {
      const menuOpen = searchParams.get("menu") === "open";
      const submenuOpen = Boolean(searchParams.get("submenu"));

      if (menuOpen && !submenuOpen) {
        router.replace("/");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [searchParams, router]);

  return (
    <header className="w-full h-full flex justify-center">

      <UserMenu showMenu={showMenu} submenu={submenu} />

      <div className="z-50 fixed w-full max-w-6xl h-12 bg-[var(--bg-2)] rounded-b-4xl shadow-sm flex flex-row-reverse md:flex-row items-center justify-between px-4 xl:pl-8 xl:pr-6">
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
            onClick={() => {
              if (showMenu) {
                setShowMenu(false);         // close instantly
                router.push("/");           // update URL asynchronously
              } else {
                setShowMenu(true);          // open instantly
                router.push("/?menu=open"); // update URL asynchronously
              }
            }}
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
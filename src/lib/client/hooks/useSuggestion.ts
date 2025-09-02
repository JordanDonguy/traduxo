"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useApp } from "@/context/AppContext";
import { useTranslationContext } from "@/context/TranslationContext";
import { useLanguageContext } from "@/context/LanguageContext";
import { useWaitForAuthStatus } from "@/lib/client/hooks/useWaitForAuthStatus";
import { translationHelper } from "@/lib/client/utils/translate";
import { suggestExpressionHelper } from "@/lib/client/utils/suggestExpression";
import { fetchExpressionPoolHelper } from "@/lib/client/utils/fetchExpressionPool";
import getSuggestionLanguage from "@/lib/client/utils/getSuggestionLanguage";

// Injected dependencies for testing
type UseSuggestionArgs = {
  router?: ReturnType<typeof useRouter>;
  session?: ReturnType<typeof useSession>;
  appContext?: ReturnType<typeof useApp>;
  translationContext?: ReturnType<typeof useTranslationContext>;
  languageContext?: ReturnType<typeof useLanguageContext>;
  waitForAuthStatus?: ReturnType<typeof useWaitForAuthStatus>;
  translationHelperFn?: typeof translationHelper;
  suggestExpressionHelperFn?: typeof suggestExpressionHelper;
  fetchExpressionPoolHelperFn?: typeof fetchExpressionPoolHelper;
  getSuggestionLanguageFn?: typeof getSuggestionLanguage;
  timeoutFn?: typeof setTimeout;
};

export function useSuggestion({
  router,
  session,
  appContext,
  translationContext,
  languageContext,
  waitForAuthStatus,
  translationHelperFn = translationHelper,
  suggestExpressionHelperFn = suggestExpressionHelper,
  fetchExpressionPoolHelperFn = fetchExpressionPoolHelper,
  getSuggestionLanguageFn = getSuggestionLanguage,
  timeoutFn = setTimeout,
}: UseSuggestionArgs = {}) {

  // ---- Step 0: Initialize hooks and context ----
  const defaultAppContext = useApp();
  const defaultSession = useSession();
  const defaultWaitForAuthStatus = useWaitForAuthStatus();
  const defaultTranslationContext = useTranslationContext();
  const defaultLanguageContext = useLanguageContext();
  const defaultRouter = useRouter();

  // ---- Step 0b: Use injected values for testing if provided ----
  const { setIsLoading, setError } = appContext ?? defaultAppContext;
  const { status } = session ?? defaultSession;
  const { waitForStatus } = waitForAuthStatus ?? defaultWaitForAuthStatus;
  const {
    setInputText,
    setTranslatedText,
    setInputTextLang,
    setSaveToHistory,
    setTranslatedTextLang,
    setExplanation,
    setIsFavorite,
    setTranslationId,
    expressionPool,
    setExpressionPool,
    translationHistory,
  } = translationContext ?? defaultTranslationContext;
  const { outputLang, detectedLang } = languageContext ?? defaultLanguageContext;
  const effectiveRouter = router ?? defaultRouter;

  const [isRolling, setIsRolling] = useState(false);

  async function suggestTranslation() {
    // ---- Step 1: Trigger dice rolling animation ----
    setIsRolling(true);
    timeoutFn(() => setIsRolling(false), 600);

    // ---- Step 2: Redirect user to the main page ----
    effectiveRouter.push("/");

    // ---- Step 3: Determine which language to use for suggestion ----
    const suggestionLang = getSuggestionLanguageFn(detectedLang, outputLang);

    // ---- Step 4: Show loading spinner ----
    setIsLoading(true);

    // ---- Step 5: Wait for authentication status ----
    try {
      await waitForStatus();
    } catch (err) {
      console.error(err)
      setError("Oops! An unexpected error occured... Please try again 🙏");
      setIsLoading(false);
      return;
    };

    // ---- Step 6: Work with a local copy of the pool to prevent stale closures ----
    let pool = [...expressionPool];

    // ---- Step 7: Loop until we find a new expression or fetch a new pool ----
    while (true) {
      // ---- Step 7a: If pool is empty, fetch a new suggestion and optionally fetch pool ----
      if (!pool.length) {
        const promises: Promise<unknown>[] = [
          suggestExpressionHelperFn({
            detectedLang: suggestionLang,
            outputLang,
            setTranslatedText,
            setInputTextLang,
            setSaveToHistory,
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
            fetchExpressionPoolHelperFn({
              suggestionLang,
              setError,
              setExpressionPool,
            })
          );
        }

        await Promise.all(promises);
        break; // Done after fetching new suggestion/pool
      }

      // ---- Step 7b: Find first expression in pool that is NOT in history ----
      const newExpression = pool.find(
        (expression) =>
          !translationHistory.some(
            (t) => t.inputText.toLowerCase() === expression.toLowerCase()
          )
      );

      // ---- Step 8: If found, translate it ----
      if (newExpression) {
        await translationHelperFn({
          inputText: newExpression,
          inputLang: suggestionLang,
          outputLang,
          setInputText,
          setInputTextLang,
          setSaveToHistory,
          setTranslatedTextLang,
          setTranslatedText,
          setExplanation,
          setIsLoading,
          setIsFavorite,
          setTranslationId,
          setError,
        });

        // ---- Step 9: Remove used expression from pool ----
        setExpressionPool((prev) => prev.filter((expr) => expr !== newExpression));
        break;
      } else {
        // ---- Step 10: If none left, reset pool locally and globally, loop again ----
        setExpressionPool([]);
        pool = [];
      }
    }
  }

  return { suggestTranslation, isRolling };
}

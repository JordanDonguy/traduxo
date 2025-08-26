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

  // --- Always call hooks unconditionally ---
  const defaultAppContext = useApp();
  const defaultSession = useSession();
  const defaultWaitForAuthStatus = useWaitForAuthStatus();
  const defaultTranslationContext = useTranslationContext();
  const defaultLanguageContext = useLanguageContext();
  const defaultRouter = useRouter();

  // --- Use injected values for testing if provided ---
  const { setIsLoading, setError } = appContext ?? defaultAppContext;
  const { status } = session ?? defaultSession;
  const { waitForStatus } = waitForAuthStatus ?? defaultWaitForAuthStatus;
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
  } = translationContext ?? defaultTranslationContext;
  const { outputLang, detectedLang } = languageContext ?? defaultLanguageContext;

  const effectiveRouter = router ?? defaultRouter;

  const [isRolling, setIsRolling] = useState(false);

  async function suggestTranslation() {
    // ---- Step 1: Trigger dice rolling animation ----
    setIsRolling(true);
    timeoutFn(() => setIsRolling(false), 600);

    // ---- Step 2: Redirect to main page ----
    effectiveRouter.push("/");

    // ---- Step 3: Pick correct language for suggestion ----
    const suggestionLang = getSuggestionLanguageFn(detectedLang, outputLang);

    // ---- Step 4: Show loading spinner ----
    setIsLoading(true);

    // ---- Step 5: Wait for NextAuth to resolve authentication status ----
    await waitForStatus();

    // ---- Step 6: If no pool, fetch suggestion and optionally fetch pool ----
    if (!expressionPool.length) {
      const promises = [
        suggestExpressionHelperFn({
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
          fetchExpressionPoolHelperFn({
            setError,
            suggestionLang,
            setExpressionPool,
          })
        );
      }

      await Promise.all(promises);
      return;
    }

    // ---- Step 7: Find first expression not in history ----
    const newExpression = expressionPool.find(
      (expression) =>
        !translationHistory.some(
          (t) => t.inputText.toLowerCase() === expression.toLowerCase()
        )
    );

    // ---- Step 8: If none left, reset pool & retry ----
    if (!newExpression) {
      setExpressionPool([]);
      await suggestTranslation(); // recursive call
      return;
    }

    // ---- Step 9: Request translation for the chosen expression ----
    await translationHelperFn({
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

    // ---- Step 10: Remove used expression from pool ----
    setExpressionPool((prev) => prev.filter((expr) => expr !== newExpression));
  }

  return { suggestTranslation, isRolling };
}

import { useState } from "react";
import { useAuth, type AuthContextType } from "@traduxo/packages/contexts/AuthContext";
import { useApp } from "@traduxo/packages/contexts/AppContext";
import { useTranslationContext } from "@traduxo/packages/contexts/TranslationContext";
import { useLanguageContext } from "@traduxo/packages/contexts/LanguageContext";
import { useWaitForAuthStatus } from "@traduxo/packages/hooks/auth/useWaitForAuthStatus";
import { translationHelper } from "@traduxo/packages/utils/translation/translate";
import { suggestExpressionHelper } from "@traduxo/packages/utils/expression/suggestExpression";
import { fetchExpressionPoolHelper } from "@traduxo/packages/utils/expression/fetchExpressionPool";
import getSuggestionLanguage from "@traduxo/packages/utils/language/getSuggestionLanguage";

// Injected dependencies for testing
type UseSuggestionArgs = {
  translationContext?: ReturnType<typeof useTranslationContext>;
  waitForAuthStatus?: ReturnType<typeof useWaitForAuthStatus>;
  translationHelperFn?: typeof translationHelper;
  suggestExpressionHelperFn?: typeof suggestExpressionHelper;
  fetchExpressionPoolHelperFn?: typeof fetchExpressionPoolHelper;
  timeoutFn?: typeof setTimeout;
};

export function useSuggestion({
  translationContext,
  waitForAuthStatus,
  translationHelperFn = translationHelper,
  suggestExpressionHelperFn = suggestExpressionHelper,
  fetchExpressionPoolHelperFn = fetchExpressionPoolHelper,
  timeoutFn = setTimeout,
}: UseSuggestionArgs) {

  // ---- Step 0: Initialize hooks and context ----
  const defaultWaitForAuthStatus = useWaitForAuthStatus();
  const defaultTranslationContext = useTranslationContext();

  // ---- Step 0b: Use injected values for testing if provided ----
  const { setIsLoading, setError } = useApp()
  const { status, token } = useAuth()
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
  const { outputLang, detectedLang } = useLanguageContext()

  const [isRolling, setIsRolling] = useState(false);

  async function suggestTranslation() {
    // ---- Step 1: Trigger dice rolling animation ----
    setIsRolling(true);
    timeoutFn(() => setIsRolling(false), 600);

    // ---- Step 2: Determine which language to use for suggestion ----
    const suggestionLang = getSuggestionLanguage(detectedLang, outputLang);

    // ---- Step 3: Show loading spinner ----
    setIsLoading(true);

    // ---- Step 4: Wait for authentication status ----
    try {
      await waitForStatus();
    } catch (err) {
      console.error(err)
      setError("Oops! An unexpected error occured... Please try again 🙏");
      setIsLoading(false);
      return;
    };

    // ---- Step 5: Work with a local copy of the pool to prevent stale closures ----
    let pool = [...expressionPool];

    // ---- Step 6: Loop until we find a new expression or fetch a new pool ----
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
            token,
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

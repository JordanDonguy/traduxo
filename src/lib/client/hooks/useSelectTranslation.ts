"use client";

import { useRouter } from "next/navigation";
import { useTranslationContext } from "@/context/TranslationContext";
import { useLanguageContext } from "@/context/LanguageContext";

import type { Translation } from "../../../../types/translation";

// Injected dependencies for testing
type UseSelectTranslationArgs = {
  router?: ReturnType<typeof useRouter>;
  translationContext?: ReturnType<typeof useTranslationContext>;
  languageContext?: ReturnType<typeof useLanguageContext>;
};

export function useSelectTranslation({
  router,
  translationContext,
  languageContext,
}: UseSelectTranslationArgs = {}) {
  // ---- Step 1: Grab router + contexts ----

  // --- Always call hooks unconditionally ---
  const defaultTranslationContext = useTranslationContext();
  const defaultLanguageContext = useLanguageContext();
  const defaultRouter = useRouter();

  // --- Use injected values for testing if provided ---
  const { loadTranslationFromMenu } = translationContext ?? defaultTranslationContext;
  const { setInputLang, setOutputLang } = languageContext ?? defaultLanguageContext;
  const effectiveRouter = router ?? defaultRouter;

  // ---- Step 2: Shared handler ----
  function selectTranslation(t: Translation, isFavorite: boolean) {
    loadTranslationFromMenu(t, isFavorite);
    setInputLang(t.inputLang);
    setOutputLang(t.outputLang);
    effectiveRouter.push("/");
  }

  return { selectTranslation };
}

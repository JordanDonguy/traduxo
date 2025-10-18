import { useTranslationContext } from "@traduxo/packages/contexts/TranslationContext";
import { useLanguageContext } from "@traduxo/packages/contexts/LanguageContext";

import type { Translation } from "@traduxo/packages/types/translation";

// Injected dependencies for testing
type UseSelectTranslationArgs = {
  router?: { push: (path: string) => void }; // generic router
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

  // --- Use injected values for testing if provided ---
  const { loadTranslationFromMenu } = translationContext ?? defaultTranslationContext;
  const { setInputLang, setOutputLang } = languageContext ?? defaultLanguageContext;
  const effectiveRouter = router ?? { push: () => {} }; // fallback fake router in case hook called without router argument

  // ---- Step 2: Shared handler ----
  function selectTranslation(t: Translation, isFavorite: boolean): void {
    loadTranslationFromMenu(t, isFavorite);
    setInputLang(t.inputLang);
    setOutputLang(t.outputLang);
    effectiveRouter.push("/");
  }

  return { selectTranslation };
}

"use client"

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { useTranslationContext } from "@/context/TranslationContext";
import { useFavoriteToggle } from "@/lib/client/hooks/favorites/useFavoriteToggle";
import { useSwitchTranslations } from "@/lib/client/hooks/translation/useSwitchTranslations";
import { showAuthToasts } from "@/lib/client/utils/ui/authToasts";
import { replaceQuotesInHTML } from "@/lib/client/utils/ui/replaceQuotesInHTML";
import ErrorSection from "./ErrorSection";
import TranslationSection from "./TranslationSection";
import ExplanationSection from "./ExplanationSection";
import LandingDisplay from "./LandingDisplay";
import LoadingAnimation from "./LoadingAnimation";

function MainDisplay() {
  const { isLoading, error, setError } = useApp();

  const {
    translatedText,
    setTranslatedText,
    inputTextLang,
    translatedTextLang,
    explanation,
    isFavorite,
  } = useTranslationContext();

  const { handleFavorite, isFavLoading } = useFavoriteToggle();
  const { switchTranslations, fading } = useSwitchTranslations({
    translatedText,
    setTranslatedText,
    timeoutFn: setTimeout
  });

  const router = useRouter();

  // Display a toast message if there's an error or success message in url params
  useEffect(() => {
    showAuthToasts(router)
  }, [router])

  useEffect(() => {
    const paragraphs = document.querySelectorAll('p');
    paragraphs.forEach(p => {
      p.innerHTML = replaceQuotesInHTML(p.innerHTML);
    });
  }, [explanation.length]);

  return (
    <section className={`relative flex flex-col items-center w-full duration-500 mt-12 mb-40 lg:mb-56
      ${!translatedText.length ? "justify-center" : "justify-start"}
      ${explanation.length > 500 ? "mb-40 lg:mb-56" : "mb-52 lg:mb-68"}`}
    >
      {error.length ? (
        <ErrorSection error={error} setError={setError} />
      ) : isLoading ? (
        <LoadingAnimation />
      ) : translatedText.length === 0 ? (
        <LandingDisplay />
      ) : (
        <TranslationSection
          translatedText={translatedText}
          inputTextLang={inputTextLang}
          translatedTextLang={translatedTextLang}
          fading={fading}
          isFavorite={isFavorite}
          isFavLoading={isFavLoading}
          onFavoriteClick={handleFavorite}
          onSwitchTranslations={switchTranslations}
        >

          <ExplanationSection
            explanation={explanation}
            translatedText={translatedText}
          />

        </TranslationSection>
      )}
    </section>
  )
}

export default MainDisplay

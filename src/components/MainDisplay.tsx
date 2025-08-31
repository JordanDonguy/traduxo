"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { useTranslationContext } from "@/context/TranslationContext";
import { useFavoriteToggle } from "@/lib/client/hooks/useFavoriteToggle";
import { useSwitchTranslations } from "@/lib/client/hooks/useSwitchTranslations";
import { showAuthToasts } from "@/lib/client/utils/authToasts";
import { replaceQuotesInHTML } from "@/lib/client/utils/replaceQuotesInHTML";
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
    setTranslatedText,
    timeoutFn: setTimeout
  });

  const [mounted, setMounted] = useState<boolean>(false);
  const [ready, setReady] = useState<boolean>(false);
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

  // This is used to make a css translating effect when component mounts
  // The delay is then removed to prevent late color switching when switching light / dark theme
  useEffect(() => {
    if (isLoading) {
      setMounted(false);
      setReady(false);
    } else if (translatedText.length) {
      const timeoutMounted = setTimeout(() => setMounted(true), 10)
      const timeoutReady = setTimeout(() => setReady(true), 1000);
      return () => {
        clearTimeout(timeoutMounted);
        clearTimeout(timeoutReady);
      }
    } else {
      setMounted(false);
      setReady(false);
    }
  }, [translatedText, isLoading]);

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
          mounted={mounted}
          ready={ready}
          isFavorite={isFavorite}
          isFavLoading={isFavLoading}
          onFavoriteClick={handleFavorite}
          onSwitchTranslations={switchTranslations}
        >

          <ExplanationSection
            explanation={explanation}
            mounted={mounted}
            ready={ready}
          />

        </TranslationSection>
      )}
    </section>
  )
}

export default MainDisplay

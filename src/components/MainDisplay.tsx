"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { useTranslationContext } from "@/context/TranslationContext";
import { useCooldown } from "@/lib/client/hooks/useCooldown";
import { useFavoriteToggle } from "@/lib/client/hooks/useFavoriteToggle";
import { useExplanation } from "@/lib/client/hooks/useExplanation";
import { useSwitchTranslations } from "@/lib/client/hooks/useSwitchTranslations";
import { showAuthToasts } from "@/lib/client/utils/authToasts";
import ErrorSection from "./ErrorSection";
import TranslationSection from "./TranslationSection";
import ExplanationSection from "./ExplanationSection";
import LandingDisplay from "./LandingDisplay";
import LoadingAnimation from "./LoadingAnimation";

function MainDisplay() {
  const { isLoading, error, setError, setShowLoginForm } = useApp();

  const {
    translatedText,
    setTranslatedText,
    inputTextLang,
    translatedTextLang,
    explanation,
    isFavorite,
  } = useTranslationContext();

  const { handleFavorite, isFavLoading } = useFavoriteToggle();
  const { handleExplanation, isExpLoading, explanationError } = useExplanation();
  const { switchTranslations, fading } = useSwitchTranslations({
    setTranslatedText,
    timeoutFn: setTimeout
  });

  const [mounted, setMounted] = useState<boolean>(false);
  const [ready, setReady] = useState<boolean>(false);
  const router = useRouter();

  const cooldown = useCooldown(error.startsWith("Too many requests"));  // Starts a cooldown if rateLimiter error

  // Reset error state when cooldown arrives at 0 if rateLimiting error
  useEffect(() => {
    if (cooldown === 0 && error.startsWith("Too many requests")) {
      setError("")
    }
  }, [cooldown, error, setError]);

  // Display a toast message if there's an error or success message in url params
  useEffect(() => {
    showAuthToasts(router)
  }, [router])

  useEffect(() => {
    const paragraphs = document.querySelectorAll('p');
    paragraphs.forEach(p => {
      p.innerHTML = p.innerHTML
        // Replace double quotes
        .replace(/"([^"]+)"/g, '<strong>$1</strong>')
        // Replace french style quotes
        .replace(/«([^»]+)»/g, '<strong>$1</strong>');
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
    <section className={`relative flex flex-col items-center w-full duration-500 mb-40 lg:mb-56 ${!translatedText.length ? "justify-center" : "justify-start"}`}>
      {error.length ? (
        <ErrorSection error={error} cooldown={cooldown} onLoginClick={() => setShowLoginForm(true)} />

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
            error={explanationError}
            isLoading={isExpLoading}
            mounted={mounted}
            ready={ready}
            onGenerate={handleExplanation}
          />

        </TranslationSection>
      )}
    </section>
  )
}

export default MainDisplay

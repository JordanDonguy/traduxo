"use client"

import { useEffect } from "react";
import { useApp } from "@traduxo/packages/contexts/AppContext";
import { useTranslationContext } from "@traduxo/packages/contexts/TranslationContext";
import { useFavoriteToggle } from "@traduxo/packages/hooks/favorites/useFavoriteToggle";
import { useSwitchTranslations } from "@traduxo/packages/hooks/translation/useSwitchTranslations";
import { replaceQuotesInHTML } from "@/lib/client/utils/ui/replaceQuotesInHTML";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import ErrorSection from "./ErrorSection";
import TranslationSection from "./TranslationSection";
import ExplanationSection from "./ExplanationSection";
import LandingDisplay from "./LandingDisplay";
import LoadingAnimation from "./LoadingAnimation";

function MainDisplay() {
  const { isLoading, error, setError } = useApp();
  const router = useRouter();

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

  // Add or remove from favorites, display toast error if not successful
  const onFavoriteClick = async () => {
    const res = await handleFavorite();
    if (!res.success) {
      router.push("/");
      toast.error(res.message)
    }
  };

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
          onFavoriteClick={onFavoriteClick}
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

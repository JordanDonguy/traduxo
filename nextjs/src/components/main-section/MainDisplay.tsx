"use client"

import { useEffect } from "react";
import { useApp } from "@traduxo/packages/contexts/AppContext";
import { useLanguageContext } from "@traduxo/packages/contexts/LanguageContext";
import { useTranslationContext } from "@traduxo/packages/contexts/TranslationContext";
import { useFavoriteToggle } from "@traduxo/packages/hooks/favorites/useFavoriteToggle";
import { useSwitchTranslations } from "@traduxo/packages/hooks/translation/useSwitchTranslations";
import { replaceQuotesInHTML } from "@/lib/client/utils/ui/replaceQuotesInHTML";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import ErrorSection from "./ErrorSection";
import TranslationSection from "./TranslationSection";
import ExplanationSection from "./ExplanationSection";
import LanguageSelector from "./LanguageSelector";
import { useLanguageSwitch } from "@traduxo/packages/hooks/translation/useLanguageSwitch";
import { useVoiceInput } from "@/lib/client/hooks/ui/useVoiceInput";
import { translationHelper } from "@traduxo/packages/utils/translation/translate";
import TextInputForm from "./TextInputForm";

function MainDisplay() {
  const {
    isLoading,
    setIsLoading,
    error,
    setError,
  } = useApp();

  const router = useRouter();

  const {
    inputLang,
    outputLang,
    setInputLang,
    setOutputLang,
    detectedLang
  } = useLanguageContext();

  const {
    inputText,
    setInputText,
    translatedText,
    setTranslatedText,
    inputTextLang,
    setInputTextLang,
    translatedTextLang,
    setTranslatedTextLang,
    explanation,
    setExplanation,
    isFavorite,
    setIsFavorite,
    setSaveToHistory,
    setTranslationId
  } = useTranslationContext();

  const { isSwitching, switchLanguage } = useLanguageSwitch({
    inputLang,
    outputLang,
    inputTextLang,
    translatedTextLang,
    setInputLang,
    setOutputLang,
    detectedLang,
  });

  const { isListening, handleVoice } = useVoiceInput({ inputLang, inputText, setInputText });

  const { handleFavorite, isFavLoading } = useFavoriteToggle();
  const { switchTranslations, fading } = useSwitchTranslations({
    translatedText,
    setTranslatedText,
    timeoutFn: setTimeout
  });

  // Handle translation request
  const handleTranslate = async (text: string) => {
    translationHelper({
      inputText: text,
      inputLang,
      outputLang,
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
  };

  // Add or remove from favorites, display toast error if not successful
  const onFavoriteClick = async () => {
    const res = await handleFavorite();
    if (!res.success) {
      router.push("/");
      toast.error(res.message)
    }
  };

  // Remove quotes from paragraph returned by AI
  useEffect(() => {
    const paragraphs = document.querySelectorAll('p');
    paragraphs.forEach(p => {
      p.innerHTML = replaceQuotesInHTML(p.innerHTML);
    });
  }, [explanation.length]);

  // Update input text to be the original expression returned by AI
  useEffect(() => {
    if (translatedText) {
      const returnedInputText = translatedText.find(text => text.type === "expression");
      setInputText(returnedInputText?.value || "");
    }
  }, [translatedText, setInputText])

  return (
    <section className="relative md:gap-2 flex flex-col items-center w-full px-2 md:px-8 xl:px-20 mt-20 md:mt-28">
      {error.length ? (
        <ErrorSection error={error} setError={setError} />
      ) : (
        <>
          <LanguageSelector
            inputLang={inputLang}
            outputLang={outputLang}
            setInputLang={setInputLang}
            setOutputLang={setOutputLang}
            isSwitching={isSwitching}
            switchLanguage={switchLanguage}
            inputTextLang={inputTextLang}
            handleTranslate={handleTranslate}
            translatedText={translatedText}
          />
          <section className="grid grid-cols-1 lg:grid-cols-2 w-full mt-8 gap-8">
            <TextInputForm
              inputText={inputText}
              setInputText={setInputText}
              handleTranslate={handleTranslate}
              isListening={isListening}
              handleVoice={handleVoice}
              inputLang={inputTextLang}
            />
            <TranslationSection
              translatedText={translatedText}
              translatedTextLang={translatedTextLang}
              fading={fading}
              isFavorite={isFavorite}
              isFavLoading={isFavLoading}
              onFavoriteClick={onFavoriteClick}
              onSwitchTranslations={switchTranslations}
              isLoading={isLoading}
            />
            <ExplanationSection
              explanation={explanation}
              translatedText={translatedText}
            />
          </section>
        </>
      )}
    </section>
  )
}

export default MainDisplay

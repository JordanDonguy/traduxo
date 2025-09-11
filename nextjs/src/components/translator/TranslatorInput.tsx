"use client";

import { useApp } from "@traduxo/packages/contexts/AppContext";
import { useTranslationContext } from "@traduxo/packages/contexts/TranslationContext";
import { useLanguageContext } from "@traduxo/packages/contexts/LanguageContext";
import { useLanguageSwitch } from "@/lib/client/hooks/ui/useLanguageSwitch";
import { useVoiceInput } from "@/lib/client/hooks/ui/useVoiceInput";
import { translationHelper } from "@/lib/client/utils/translation/translate";
import LanguageSelector from "./LanguageSelector";
import TextInputForm from "./TextInputForm";

export default function TranslatorInput() {
  const { setIsLoading, setError } = useApp();
  const { inputText, setInputText, setTranslatedText, setSaveToHistory, setInputTextLang, setTranslatedTextLang, setExplanation, setIsFavorite, setTranslationId } = useTranslationContext();
  const { inputLang, outputLang, setInputLang, setOutputLang, detectedLang } = useLanguageContext();

  const { isSwitching, switchLanguage } = useLanguageSwitch({ inputLang, outputLang, setInputLang, setOutputLang, detectedLang });
  const { isListening, showWarning, setShowWarning, handleVoice } = useVoiceInput({ inputLang, inputText, setInputText });

  // Handle translation request
  const handleTranslate = async (e: React.FormEvent) => {
    e.preventDefault();
    translationHelper({
      inputText,
      inputLang,
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
  };

  return (
    <div className="fixed z-20 bottom-0 lg:bottom-8 w-full max-w-xl lg:max-w-3xl h-40 sm:h-48 bg-[var(--bg-2)] shadow-sm rounded-t-4xl lg:rounded-4xl flex flex-col justify-between items-center py-4">
      <LanguageSelector
        inputLang={inputLang}
        outputLang={outputLang}
        setInputLang={setInputLang}
        setOutputLang={setOutputLang}
        isSwitching={isSwitching}
        switchLanguage={switchLanguage}
        showWarning={showWarning}
        setShowWarning={setShowWarning}
      />
      <TextInputForm
        inputText={inputText}
        setInputText={setInputText}
        handleTranslate={handleTranslate}
        isListening={isListening}
        handleVoice={handleVoice}
      />
    </div>
  );
}

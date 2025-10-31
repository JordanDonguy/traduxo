import React from "react";
import { View, ScrollView } from "react-native";
import { useApp } from "@traduxo/packages/contexts/AppContext";
import { useTranslationContext } from "@traduxo/packages/contexts/TranslationContext";
import { useFavoriteToggle } from "@traduxo/packages/hooks/favorites/useFavoriteToggle";
import { useSwitchTranslations } from "@traduxo/packages/hooks/translation/useSwitchTranslations"
import Toast from "react-native-toast-message";
import TranslationSection from "./TranslationSection";
import LandingDisplay from "./LandingDisplay";
import LoadingAnimation from "./LoadingAnimation";
import ExplanationSection from "./ExplanationSection";
import ErrorSection from "./ErrorSection";

export default function MainDisplay({ onFocusInput }: { onFocusInput: () => void }) {
  const { isLoading, error, setError } = useApp();
  const {
    translatedText,
    setTranslatedText,
    inputTextLang,
    translatedTextLang,
    explanation,
    isFavorite
  } = useTranslationContext();

  const { handleFavorite } = useFavoriteToggle();
  const { switchTranslations, fading } = useSwitchTranslations({
    translatedText,
    setTranslatedText,
    timeoutFn: setTimeout
  });

  // Add or remove from favorites, display toast error if not successful
  const onFavoriteClick = async () => {
    const res = await handleFavorite();
    if (!res.success) {
      Toast.show({
        type: "error",
        text1: res.message
      })
    }
  };

  // ------------------------------
  // ---- Render errors if any ----
  // ------------------------------
  if (error.length) return <ErrorSection error={error} setError={setError} isExplanationError={false} />;


  // ------------------------------
  // -- Render loading animation --
  // ------------------------------
  if (isLoading) return (
    <View className="bg-white dark:bg-zinc-950 flex-1 pb-52 flex justify-center">
      <LoadingAnimation />
    </View>
  );


  // ------------------------------
  // --- Render landing display ---
  // ------------------------------
  if (translatedText.length === 0) return <LandingDisplay onFocusInput={onFocusInput} />;


  // ----------------------------------
  // Render translations & explanations
  // ----------------------------------
  return (
    <ScrollView
      className="bg-white dark:bg-zinc-950 mb-48"
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled
    >
      <TranslationSection
        translatedText={translatedText}
        inputTextLang={inputTextLang}
        translatedTextLang={translatedTextLang}
        fading={fading}
        isFavorite={isFavorite}
        isFavLoading={false}
        onFavoriteClick={onFavoriteClick}
        onSwitchTranslations={switchTranslations}
      />
      <ExplanationSection
        explanation={explanation}
      />
    </ScrollView>

  );
}

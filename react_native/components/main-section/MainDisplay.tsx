import React from "react";
import { View, ScrollView } from "react-native";
import { useApp } from "@traduxo/packages/contexts/AppContext";
import { useTranslationContext } from "@traduxo/packages/contexts/TranslationContext";
import { useFavoriteToggle } from "@traduxo/packages/hooks/favorites/useFavoriteToggle";
import Toast from "react-native-toast-message";
import TranslationSection from "./TranslationSection";
import LandingDisplay from "./LandingDisplay";
import LoadingAnimation from "./LoadingAnimation";
import ExplanationSection from "./ExplanationSection";

export default function MainDisplay() {
  const { isLoading, error } = useApp();
  const { translatedText, inputTextLang, translatedTextLang, explanation, isFavorite } =
    useTranslationContext();

  const { handleFavorite } = useFavoriteToggle();

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

  if (error.length) return null; // todo: render ErrorSection later
  if (isLoading) return (
    <View className="bg-white dark:bg-zinc-950 flex-1 pb-52 flex justify-center">
      <LoadingAnimation />
    </View>
  );
  if (translatedText.length === 0) return <LandingDisplay />;

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
        fading={[]} // to implement fading later
        isFavorite={isFavorite}
        isFavLoading={false}
        onFavoriteClick={onFavoriteClick}
        onSwitchTranslations={() => { }}
      />
      <ExplanationSection
        explanation={explanation}
      />
    </ScrollView>

  );
}

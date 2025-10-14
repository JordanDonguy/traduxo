import React from "react";
import { View, ScrollView } from "react-native";
import { useApp } from "@traduxo/packages/contexts/AppContext";
import { useTranslationContext } from "@traduxo/packages/contexts/TranslationContext";
import TranslationSection from "./TranslationSection";
import LandingDisplay from "./LandingDisplay";
import LoadingAnimation from "./LoadingAnimation";
import ExplanationSection from "./ExplanationSection";

export default function MainDisplay() {
  const { isLoading, error } = useApp();
  const { translatedText, inputTextLang, translatedTextLang, explanation, isFavorite } =
    useTranslationContext();

  if (error.length) return null; // todo: render ErrorSection later
  if (isLoading) return (
    <View className="flex-1 mb-60 flex justify-center">
      <LoadingAnimation />
    </View>
  );
  if (translatedText.length === 0) return <LandingDisplay />;

  return (

    <ScrollView
      className="bg-white dark:bg-black mb-60"
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
        onFavoriteClick={() => { }}
        onSwitchTranslations={() => { }}
      />
      <ExplanationSection
        explanation={explanation}
        translatedText={translatedText}
        inputTextLang={inputTextLang}
        translatedTextLang={translatedTextLang}
      />
    </ScrollView>

  );
}

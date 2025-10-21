import React from "react";
import { View, TouchableOpacity, FlatList } from "react-native";
import AppText from "../AppText";
import { Check } from "lucide-react-native";
import ISO6391 from "iso-639-1";
import { useExplanationLanguage } from "@traduxo/packages/hooks/explanation/useExplanationLanguage";
import { getSortedLanguageCodes } from "@traduxo/packages/utils/language/sortedLanguageCodes";
import { useTheme } from "@react-navigation/native";
import { useScrollGradient } from "@/hooks/useScrollGradient";
import TopGradient from "./TopGradient";

export default function ExplanationLanguage() {
  const { systemLang, changeSystemLang } = useExplanationLanguage({});
  const { colors } = useTheme();
  const { onScroll, showTopGradient } = useScrollGradient();
  const languages = getSortedLanguageCodes();

  // Render explanation language items
  const renderItem = ({ item: code }: { item: string }) => {
    const isSelected = systemLang === code;

    return (
      <TouchableOpacity
        onPress={() => changeSystemLang(code)}
        accessibilityLabel={`Select explanation language code ${code}`}
        className={`relative w-full flex-row items-center justify-center bg-zinc-200 dark:bg-zinc-800 rounded-2xl p-6 mb-4 border ${isSelected
          ? "border-zinc-500"
          : "border-transparent"
          }`}
        activeOpacity={0.7}
      >
        <AppText className="text-lg text-center">
          {ISO6391.getName(code) || code} ({code.toUpperCase()})
        </AppText>

        {isSelected && (
          <View className="absolute right-6">
            <Check size={24} color={colors.text} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <>
      <View
        className="w-full flex-1 items-center justify-start pb-24"
      >

        <FlatList
          onScroll={onScroll}
          data={languages}
          keyExtractor={(item) => item}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          className="w-full"

        />

      </View>

      <TopGradient show={showTopGradient} />
    </>
  );
}

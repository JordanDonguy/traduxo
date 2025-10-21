import React, { useMemo } from "react";
import { View, TouchableOpacity } from "react-native";
import AppText from "../AppText";
import { Star } from "lucide-react-native";
import { TranslationItem } from "@traduxo/packages/types/translation";
import { useTheme } from "@react-navigation/native";
import { MotiView } from "moti";

type TranslationSectionProps = {
  translatedText: TranslationItem[];
  inputTextLang: string;
  translatedTextLang: string;
  fading: string[];
  isFavorite: boolean;
  isFavLoading: boolean;
  onFavoriteClick: () => void;
  onSwitchTranslations: (idx: string) => void;
  children?: React.ReactNode;
};

function capitalizeFirstLetter(str: string) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function TranslationSection({
  translatedText,
  inputTextLang,
  translatedTextLang,
  fading,
  isFavorite,
  isFavLoading,
  onFavoriteClick,
  onSwitchTranslations,
  children,
}: TranslationSectionProps) {
  const { colors } = useTheme();

  const expression = useMemo(
    () => translatedText.find((item) => item.type === "expression")?.value ?? "",
    [translatedText]
  );
  const mainTranslation = useMemo(
    () => translatedText.find((item) => item.type === "main_translation")?.value ?? "",
    [translatedText]
  );
  const alternatives = useMemo(
    () => translatedText.filter((item) => item.type === "alternative").map((a) => a.value),
    [translatedText]
  );

  return (
    <MotiView
      from={{ translateX: -200, opacity: 0 }}
      animate={{ translateX: 0, opacity: 1 }}
      transition={{ type: "spring", damping: 22, stiffness: 200, mass: 1.5 }}
      className="w-full flex flex-col justify-center px-4 mt-8"
    >
      {/* Input language + expression */}
      <View className="flex-row mb-8 border border-zinc-500 rounded-md">
        <AppText className="z-10 py-2 w-14 font-sans text-xl text-center border-r border-zinc-500">
          {inputTextLang.length <= 2 ? inputTextLang.toUpperCase() : ""}
        </AppText>
        <AppText className="pt-2 pl-4 pr-2 font-sans text-xl flex-1 bg-zinc-200 dark:bg-zinc-800 rounded-r-md">
          {capitalizeFirstLetter(expression)}
        </AppText>
      </View>

      {/* Output language + main translation + alternatives */}
      <View className="border-t border-zinc-500 pt-8">
        <View className="flex-row mb-6 border border-zinc-500 rounded-md">
          <AppText className="z-10 py-2 w-14 font-sans text-xl text-center border-r border-zinc-500">
            {translatedTextLang.length <= 2 ? translatedTextLang.toUpperCase() : ""}
          </AppText>

          <View className="flex-row flex-1 items-center justify-between bg-zinc-200 dark:bg-zinc-800 rounded-r-md">
            <MotiView
              animate={{
                scale: fading.includes(mainTranslation) ? 0 : 1,
                opacity: fading.includes(mainTranslation) ? 0 : 1,
              }}
              transition={{ type: "timing", duration: 200 }}
                style={{ flexShrink: 1 }}
            >
              <AppText className="py-2 pl-4 font-sans text-xl flex-1">
                {capitalizeFirstLetter(mainTranslation)}
              </AppText>
            </MotiView>

            <TouchableOpacity
              onPress={onFavoriteClick}
              disabled={isFavLoading}
              className="p-3 rounded-r-md"
            >
              <Star
                size={28}
                fill={isFavorite ? colors.text : "transparent"}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>
        </View>

        {alternatives.map((alt, idx) => (
          <TouchableOpacity key={idx} onPress={() => onSwitchTranslations(alt)}>
            <MotiView
              animate={{
                translateX: fading.includes(alt) ? -500 : 0,
                opacity: fading.includes(alt) ? 0 : 1,
              }}
              transition={{ type: "timing", duration: 200 }}
            >
              <AppText className="pl-4 mb-2 font-sans text-lg">
                ● {capitalizeFirstLetter(alt)}
              </AppText>
            </MotiView>
          </TouchableOpacity>
        ))}
      </View>
    </MotiView>
  );
}

import { MotiView } from "moti";
import React from "react";
import { TouchableOpacity, View, Text } from "react-native";
import type { Translation } from "@traduxo/packages/types/translation";

interface TranslationItemProps {
  t: Translation;
  setShowMenu: (value: boolean) => void;
  selectTranslation: (t: Translation, isFavorite: boolean) => void;
  deleteTranslation: (id: string) => Promise<void>;
  isFavorite: boolean;
}

const _TranslationItem: React.FC<TranslationItemProps> = ({
  t,
  setShowMenu,
  selectTranslation,
  deleteTranslation,
  isFavorite,
}: TranslationItemProps) => {
  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: "timing", duration: 200 }}
    >
      <TouchableOpacity
        onPress={() => {
          setShowMenu(false);
          selectTranslation(t, isFavorite);
        }}
        className={`relative w-full flex flex-col gap-4 rounded-lg p-3 border border-zinc-600`}
      >

        {/* Input language & text */}
        <View className="flex flex-row items-center rounded-lg border border-zinc-600">
          <Text className="text-black dark:text-white text-lg p-2 w-14 border-r border-zinc-600 flex text-center">
            {t.inputLang.toUpperCase()}
          </Text>
          <Text
            className="flex-1 text-lg text-black dark:text-white bg-zinc-200 dark:bg-zinc-800 pl-4 pr-6 h-full align-middle rounded-r-lg"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {t.inputText}
          </Text>
        </View>

        {/* Output language & text */}
        <View className="flex flex-row items-center rounded-lg border border-zinc-600">
          <Text className="text-black dark:text-white text-lg p-2 w-14 border-r border-zinc-600 text-center">
            {t.outputLang.toUpperCase()}
          </Text>
          <Text
            className="flex-1 text-lg text-black dark:text-white bg-zinc-200 dark:bg-zinc-800 pl-4 pr-2 h-full align-middle rounded-r-lg"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {t.translation}
          </Text>
        </View>

        {/* Delete button */}
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation?.();
            deleteTranslation(t.id);
          }}
          className="absolute right-1 top-1 z-50 w-9 h-9"
        >
          <Text className="text-center text-zinc-600 dark:text-zinc-400 text-lg bg-white dark:bg-zinc-950 rounded-full border-2 border-zinc-600 dark:border-zinc-400 font-semibold">
            ╳
          </Text>
        </TouchableOpacity>

      </TouchableOpacity>
    </MotiView>
  );
}

export default React.memo(_TranslationItem);

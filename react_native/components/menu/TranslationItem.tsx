import { MotiView } from "moti";
import React from "react";
import { TouchableOpacity, View, Text } from "react-native";
import { CircleX } from "lucide-react-native";
import type { Translation } from "@traduxo/packages/types/translation";

interface TranslationItemProps {
  t: Translation;
  setShowMenu: (value: boolean) => void;
  selectTranslation: (t: Translation, isFavorite: boolean) => void;
  deleteTranslation: (id: string) => Promise<{ success: boolean; message?: string }>;
}

const _TranslationItem: React.FC<TranslationItemProps> = ({
  t,
  setShowMenu,
  selectTranslation,
  deleteTranslation,
}: TranslationItemProps) => {
  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: "spring", damping: 22, stiffness: 200, mass: 1.5 }}
    >
      <TouchableOpacity
        onPress={() => {
          setShowMenu(false);
          selectTranslation(t, false);
        }}
        className="relative w-full flex flex-col gap-4 rounded-lg p-3 border border-zinc-600"
      >
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation?.();
            deleteTranslation(t.id);
          }}
          className="absolute right-4 top-2 w-5 h-5 z-50"
        >
          <CircleX color="#999" size={28} />
        </TouchableOpacity>

        <View className="flex flex-row items-center rounded-lg border border-zinc-600">
          <View className="p-2 w-14 border-r border-gray-500 flex items-center justify-center">
            <Text className="text-black dark:text-white text-lg">{t.inputLang.toUpperCase()}</Text>
          </View>
          <Text
            className="flex-1 text-lg text-black dark:text-white bg-zinc-200 dark:bg-zinc-800 pl-4 pr-6 h-full align-middle rounded-r-lg"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {t.inputText}
          </Text>
        </View>

        <View className="flex flex-row items-center rounded-lg border border-zinc-600">
          <View className="p-2 w-14 border-r border-gray-500 flex items-center justify-center">
            <Text className="text-black dark:text-white text-lg">{t.outputLang.toUpperCase()}</Text>
          </View>
          <Text
            className="flex-1 text-lg text-black dark:text-white bg-zinc-200 dark:bg-zinc-800 pl-4 pr-2 h-full align-middle rounded-r-lg"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {t.translation}
          </Text>
        </View>
      </TouchableOpacity>
    </MotiView>
  );
}

export default React.memo(_TranslationItem);
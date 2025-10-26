import React from "react";
import { View, TouchableOpacity, TouchableWithoutFeedback, Keyboard } from "react-native";
import AppText from "../AppText";
import { useTheme } from "@react-navigation/native";
import { Dices, Languages } from "lucide-react-native";
import { useSuggestion } from "@traduxo/packages/hooks/suggestion/useSuggestion";
import { MotiView } from "moti";

export default function LandingDisplay() {
  const { colors } = useTheme();
  const { suggestTranslation } = useSuggestion({});

  const focusInput = () => {
    console.log("Focus translation input (to be implemented)");
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false} >
      <MotiView
        from={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 20, stiffness: 250, mass: 3 }}
        className="flex-1 flex flex-col justify-center w-full items-center px-4 pb-56 bg-white dark:bg-zinc-950"
      >
        <AppText className="font-sans text-2xl text-center max-w-[85%]">
          What can I do for you today?
        </AppText>
        {/* Buttons */}
        <View className="flex flex-col gap-6 w-full max-w-[85%] mt-12">
          {/* Suggest Expression */}
          <TouchableOpacity
            onPress={suggestTranslation}
            activeOpacity={0.8}
            className="flex flex-row justify-center items-center rounded-2xl py-4 gap-3 bg-zinc-200 dark:bg-zinc-800"
          >
            <Dices size={24} color={colors.text} />
            <AppText className="font-sans text-xl">Suggest an expression</AppText>
          </TouchableOpacity>
          {/* Translate Something */}
          <TouchableOpacity
            onPress={focusInput}
            activeOpacity={0.8}
            className="flex flex-row justify-center items-center rounded-2xl py-4 gap-3 bg-zinc-200 dark:bg-zinc-800"
          >
            <Languages size={24} color={colors.text} />
            <AppText className="font-sans text-xl">Translate something</AppText>
          </TouchableOpacity>
        </View>
      </MotiView>
    </TouchableWithoutFeedback>
  );
}

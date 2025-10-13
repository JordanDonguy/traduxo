import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Dices, Languages } from "lucide-react-native";
import { useSuggestion } from "@traduxo/packages/hooks/suggestion/useSuggestion";

export default function LandingDisplay() {
  const { suggestTranslation } = useSuggestion({});

  const focusInput = () => {
    // You can implement navigation or ref focus later
    console.log("Focus translation input (to be implemented)");
  };

  return (
    <View className="flex-1 flex flex-col justify-center w-full items-center px-4 mb-60 bg-transparent">
      <Text className="text-4xl text-center max-w-[85%] text-txt-light dark:text-txt-dark">
        What can I do for you today?
      </Text>

      {/* Buttons */}
      <View className="flex flex-col gap-6 w-full max-w-[85%] mt-12">
        {/* Suggest Expression */}
        <TouchableOpacity
          onPress={suggestTranslation}
          activeOpacity={0.8}
          className="flex flex-row justify-center items-center rounded-2xl py-4 gap-3 bg-bg2-light dark:bg-bg2-dark"
        >
          <Dices size={24} color="white" />
          <Text className="text-xl text-white">Suggest an expression</Text>
        </TouchableOpacity>

        {/* Translate Something */}
        <TouchableOpacity
          onPress={focusInput}
          activeOpacity={0.8}
          className="flex flex-row justify-center items-center rounded-2xl py-4 gap-3 bg-bg2-light dark:bg-bg2-dark"
        >
          <Languages size={24} color="white" />
          <Text className="text-xl text-white">Translate something</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

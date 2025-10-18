import React from "react";
import { View, TextInput, TouchableOpacity, Text } from "react-native";
import { Mic, CircleStop } from "lucide-react-native";
import { useApp } from "@traduxo/packages/contexts/AppContext";
import { useTheme } from "@react-navigation/native";

type Props = {
  inputText: string;
  setInputText: (text: string) => void;
  handleTranslate: () => void;
  isListening?: boolean;
  handleVoice?: () => void;
};

export default function TextInputForm({
  inputText,
  setInputText,
  handleTranslate,
  isListening = false,
  handleVoice,
}: Props) {
  const { showMenu } = useApp();
  const { colors } = useTheme();

  return (
    <View
      pointerEvents={showMenu ? "none" : "auto"}
      className="w-full flex items-center justify-center relative"
    >
      {/* Form container */}
      <View className="w-full flex-row items-center rounded-2xl h-16 border border-zinc-400 dark:border-zinc-600 mt-2">
        <TextInput
          className="font-sans flex-1 h-full px-6 text-lg text-black dark:text-white"
          placeholder="Enter some text..."
          placeholderTextColor="#9ca3af"
          value={inputText}
          onChangeText={setInputText} 
          maxLength={100}
          onSubmitEditing={handleTranslate}
          returnKeyType="send"
        />

        {/* Voice button */}
        <TouchableOpacity
          onPress={handleVoice}
          activeOpacity={0.7}
          className="w-12 h-full pr-2 rounded-full flex justify-center items-center active:opacity-70"
        >
          {!isListening ? (
            <Mic size={28} color={colors.text} />
          ) : (
            <CircleStop size={28} color={colors.text} />
          )}
        </TouchableOpacity>
      </View>

      {/* Character limit warning */}
      {inputText.length >= 100 && (
        <Text className="font-sans absolute bottom-1 left-[6%] text-xs text-neutral-400 italic">
          100 characters max allowed
        </Text>
      )}
    </View>
  );
}

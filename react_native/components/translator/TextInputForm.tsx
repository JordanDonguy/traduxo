import React from "react";
import { View, TextInput, TouchableOpacity, Text } from "react-native";
import { useApp } from "@traduxo/packages/contexts/AppContext";
import VoiceInputButton from "./VoiceInputButton";

type Props = {
  inputText: string;
  setInputText: (text: string) => void;
  handleTranslate: (audioBase64?: string) => Promise<void>;
};

export default function TextInputForm({
  inputText,
  setInputText,
  handleTranslate,
}: Props) {
  const { showMenu } = useApp();

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
          onSubmitEditing={() => handleTranslate()}
          returnKeyType="send"
        />

        {/* Voice button */}
        <VoiceInputButton handleTranslate={handleTranslate} />
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

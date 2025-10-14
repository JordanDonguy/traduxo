import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import Markdown from "react-native-markdown-display";
import LoadingAnimation from "./LoadingAnimation";
import { useExplanation } from "@traduxo/packages/hooks/explanation/useExplanation";
import { TranslationItem } from "@traduxo/packages/types/translation";
import { blurActiveInput } from "@traduxo/packages/utils/ui/blurActiveInput";
import { createReader } from "@traduxo/packages/utils/translation/createReader";
import { getExplanationPrompt } from "@traduxo/packages/utils/geminiPrompts";
import { useLanguageContext } from "@traduxo/packages/contexts/LanguageContext";

type ExplanationSectionProps = {
  explanation: string;
  translatedText: TranslationItem[];
  inputTextLang: string;
  translatedTextLang: string;
};

export default function ExplanationSection({
  explanation,
  translatedText,
  inputTextLang,
  translatedTextLang
}: ExplanationSectionProps) {
  const { systemLang } = useLanguageContext();

  const { handleExplanation, isExpLoading, setIsExpLoading, explanationError, setExplanationError } = useExplanation({});

  const fetchExplanation = async () => {
    setIsExpLoading(true);
    const prompt = getExplanationPrompt({ inputTextLang, translatedTextLang, translatedText, systemLang });
    const reader = await createReader(prompt, "explanation")
    handleExplanation(reader);
  }

  if (explanationError.length) {
    return (
      <View>
        <Text className="font-sans text-black dark:text-white mt-8 text-lg">{explanationError}</Text>
      </View>
    );
  }

  if (explanation.length) {
    return (
      <View className="mb-8 px-4">
        <Markdown
          style={{
            body: {
              color: 'white', // to replace with light/dark color
              fontSize: 18,
              fontFamily: "OpenSans-Regular"
            },
            paragraph: {
              marginVertical: 8,
            },
            list_item: {
              backgroundColor: '#2a2a2a', // to replace with light/dark color
              borderRadius: 8,
              padding: 8,
              marginVertical: 12,
            },
            heading2: {
              fontSize: 30,
              fontWeight: '600',
              marginTop: 24,
              paddingTop: 24,
              borderTopWidth: 1,
              borderTopColor: "#71717a",  // to replace with light/dark color
              marginBottom: 16,
            },
            heading3: {
              fontSize: 26,
              fontWeight: '600',
              paddingVertical: 16,
            },
            strong: {
              fontWeight: '800',
              color: 'white',     // to replace with light/dark color
              textShadowColor: 'rgba(255,255,255,0.5)',
              textShadowOffset: { width: 0, height: 0 },
              textShadowRadius: 1,
            },
          }}
        >
          {explanation}
        </Markdown>
      </View>
    );
  }


  if (isExpLoading) {
    return (
      <View className="flex justify-center items-center w-full h-14 mt-8">
        <LoadingAnimation />
      </View>
    );
  }

  if (!explanation.length) {
    return (
      <TouchableOpacity
        onPress={() => {
          blurActiveInput();
          fetchExplanation();
        }}
        className="w-full max-w-xl py-4 rounded-full bg-zinc-200 dark:bg-zinc-800 self-center mt-8"
      >
        <Text className="font-sans text-center text-lg text-black dark:text-white">✨ AI explanations</Text>
      </TouchableOpacity>
    );
  }

  return null;
}

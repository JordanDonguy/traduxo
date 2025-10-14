import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import Markdown from "react-native-markdown-display";
import LoadingAnimation from "./LoadingAnimation";
import { useExplanation } from "@traduxo/packages/hooks/explanation/useExplanation";
import { blurActiveInput } from "@traduxo/packages/utils/ui/blurActiveInput";

type ExplanationSectionProps = {
  explanation: string;
};

export default function ExplanationSection({ explanation }: ExplanationSectionProps) {
  const { handleExplanation, isExpLoading, setIsExpLoading, explanationError } = useExplanation({});

  const fadeAnim = useRef(new Animated.Value(0.5)).current; // opacity
  const slideAnim = useRef(new Animated.Value(10)).current; // translateY

  useEffect(() => {
    if (explanation.length) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [explanation]);

  const fetchExplanation = async () => {
    setIsExpLoading(true);
    handleExplanation();
  };

  if (explanationError.length) {
    return (
      <View>
        <Text className="font-sans text-black dark:text-white mt-8 text-lg">{explanationError}</Text>
      </View>
    );
  }

  if (explanation.length) {
    return (
      <Animated.View
        className="mb-8 px-4"
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <Markdown
          style={{
            body: {
              color: 'white',
              fontSize: 18,
              fontFamily: "OpenSans-Regular",
            },
            paragraph: { marginVertical: 8 },
            list_item: { backgroundColor: '#2a2a2a', borderRadius: 8, padding: 8, marginVertical: 12 },
            heading2: { fontSize: 30, fontWeight: '600', marginTop: 24, paddingTop: 24, borderTopWidth: 1, borderTopColor: "#71717a", marginBottom: 16 },
            heading3: { fontSize: 26, fontWeight: '600', paddingVertical: 16 },
            strong: { fontWeight: '800', color: 'white', textShadowColor: 'rgba(255,255,255,0.5)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 1 },
          }}
        >
          {explanation}
        </Markdown>
      </Animated.View>
    );
  }

  if (isExpLoading) {
    return (
      <View className="flex justify-center items-center w-full h-14 mt-8">
        <LoadingAnimation />
      </View>
    );
  }

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

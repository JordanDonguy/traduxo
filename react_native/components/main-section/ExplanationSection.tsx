import React, { useEffect, useRef } from "react";
import { View, TouchableOpacity, Animated } from "react-native";
import AppText from "../AppText";
import Markdown from "react-native-markdown-display";
import LoadingAnimation from "./LoadingAnimation";
import { MotiView } from "moti";
import { useTheme } from "@react-navigation/native";
import { useExplanation } from "@traduxo/packages/hooks/explanation/useExplanation";
import { blurActiveInput } from "@traduxo/packages/utils/ui/blurActiveInput";

type ExplanationSectionProps = {
  explanation: string;
};

export default function ExplanationSection({ explanation }: ExplanationSectionProps) {
  const { colors, dark } = useTheme();
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
        <AppText className="font-sans mt-8 text-lg">{explanationError}</AppText>
      </View>
    );
  }

  if (explanation.length) {
    return (
      <MotiView
        from={{ translateY: 100, opacity: 0 }}
        animate={{ translateY: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 40, stiffness: 400 }}
        className="px-4 mb-8"
      >
        <Markdown
          style={{
            body: {
              color: colors.text,
              fontSize: 18,
              fontFamily: "OpenSans-Regular",
            },
            paragraph: { marginVertical: 8 },
            list_item: { backgroundColor: dark ? '#2a2a2a' : '#e4e4e7', borderRadius: 8, padding: 8, marginVertical: 12 },
            heading2: { fontSize: 30, fontWeight: '600', marginTop: 24, paddingTop: 24, borderTopWidth: 1, borderTopColor: "#71717a", marginBottom: 16 },
            heading3: { fontSize: 26, fontWeight: '600', paddingVertical: 16 },
            strong: { fontWeight: '800', color: colors.text, textShadowColor: 'rgba(255,255,255,0.5)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 1 },
          }}
        >
          {explanation}
        </Markdown>
      </MotiView>
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
    <MotiView
      from={{ translateX: -300, opacity: 0 }}
      animate={{ translateX: 0, opacity: 1 }}
      delay={300}
      transition={{ type: "spring", damping: 26, stiffness: 200, mass: 1.5 }}
    >
      <TouchableOpacity
        onPress={() => {
          blurActiveInput();
          fetchExplanation();
        }}
        className="w-full max-w-xl py-4 rounded-full bg-zinc-200 dark:bg-zinc-800 self-center mt-8"
      >
        <AppText className="font-sans text-center text-lg">✨ AI explanations</AppText>
      </TouchableOpacity>
    </MotiView>
  );
}

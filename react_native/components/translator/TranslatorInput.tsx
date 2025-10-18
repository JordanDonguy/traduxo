import React, { useEffect, useRef, useState } from "react";
import { View, Keyboard, Animated, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LanguageSelector from "./LanguageSelector";
import TextInputForm from "./TextInputForm";
import { useApp } from "@traduxo/packages/contexts/AppContext";
import { useTheme } from "@react-navigation/native";
import { useTranslationContext } from "@traduxo/packages/contexts/TranslationContext";
import { useLanguageContext } from "@traduxo/packages/contexts/LanguageContext";
import { useLanguageSwitch } from "@traduxo/packages/hooks/translation/useLanguageSwitch";
import { translationHelper } from "@traduxo/packages/utils/translation/translate";
import { LinearGradient } from 'expo-linear-gradient';

export default function TranslatorInput() {
  const { dark } = useTheme();
  const { setIsLoading, setError, showMenu } = useApp();
  const {
    inputText,
    setInputText,
    setTranslatedText,
    setSaveToHistory,
    setInputTextLang,
    setTranslatedTextLang,
    setExplanation,
    setIsFavorite,
    setTranslationId,
  } = useTranslationContext();

  const { inputLang, outputLang, setInputLang, setOutputLang, detectedLang } =
    useLanguageContext();

  const { isSwitching, switchLanguage } = useLanguageSwitch({
    inputLang,
    outputLang,
    setInputLang,
    setOutputLang,
    detectedLang,
  });

  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(0)).current;
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardVisible(true);
      Animated.timing(translateY, {
        toValue: -e.endCoordinates.height + insets.bottom,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });

    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardVisible(false);
      Animated.timing(translateY, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [insets.bottom, translateY]);

  const handleTranslate = async () => {
    setIsLoading(true);

    await translationHelper({
      inputText,
      inputLang,
      outputLang,
      setInputText,
      setInputTextLang,
      setSaveToHistory,
      setTranslatedTextLang,
      setTranslatedText,
      setExplanation,
      setIsLoading,
      setIsFavorite,
      setTranslationId,
      setError,
    });
  };

  return (
    <Animated.View
      pointerEvents={showMenu ? "none" : "auto"}
      style={[
        styles.wrapper,
        {
          transform: [{ translateY }],
        },
      ]}
    >
      {/* Gradient fade on top */}
      <LinearGradient
        colors={dark ? ['rgba(0,0,0,0.0)', 'rgba(0,0,0,0.5)'] : ['rgba(255,255,255,0.0)', 'rgba(255,255,255,0.5)']}
        pointerEvents="none"
        style={{
          height: 30,
          zIndex: 40,
        }}
      />

      {/* Content */}
      <View
        className={`w-full flex flex-col gap-4 px-2 pt-2 bg-white dark:bg-black
          border-t border-zinc-400 ${keyboardVisible ? "pb-20" : "pb-4"}`}
      >
        <LanguageSelector
          inputLang={inputLang}
          outputLang={outputLang}
          setInputLang={setInputLang}
          setOutputLang={setOutputLang}
          isSwitching={isSwitching}
          switchLanguage={switchLanguage}
        />

        <TextInputForm
          inputText={inputText}
          setInputText={setInputText}
          handleTranslate={handleTranslate}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    elevation: 40,
  },
});

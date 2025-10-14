import React from "react";
import { View, KeyboardAvoidingView, Platform } from "react-native";
import MainDisplay from "./components/main-section/MainDisplay";
import TranslatorInput from "./components/translator/TranslatorInput";

export default function IndexScreen() {
  return (
    <View className="flex-1">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <MainDisplay />
        <TranslatorInput />
      </KeyboardAvoidingView>
    </View>
  );
}

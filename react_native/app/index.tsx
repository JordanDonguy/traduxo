import React from "react";
import { TouchableWithoutFeedback, Keyboard } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LandingDisplay from "./components/main-section/LandingDisplay";
import TranslatorInput from "./components/translator/TranslatorInput";

export default function IndexScreen() {
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView className="flex-1">

        {/* Main Display*/}
        <LandingDisplay />

        {/* Fixed Translator Input at bottom */}
        <TranslatorInput />

      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

import React, { useRef } from "react";
import { View, TextInput } from "react-native";
import MainDisplay from "@/components/main-section/MainDisplay";
import TranslatorInput from "@/components/translator/TranslatorInput";
import UserMenu from "@/components/menu/UserMenu";

export default function IndexScreen() {
  const inputRef = useRef<TextInput>(null);

  const focusInput = () => {
    inputRef.current?.focus();
  };

  return (
    <View className="flex-1">
      <UserMenu />
      <MainDisplay onFocusInput={focusInput} />
      <TranslatorInput inputRef={inputRef} />
    </View>
  );
}

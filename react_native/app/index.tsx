import React from "react";
import { View } from "react-native";
import MainDisplay from "@/components/main-section/MainDisplay";
import TranslatorInput from "@/components/translator/TranslatorInput";
import UserMenu from "@/components/menu/UserMenu";

export default function IndexScreen() {
  return (
    <View className="flex-1">
      <UserMenu />
      <MainDisplay />
      <TranslatorInput />
    </View>
  );
}

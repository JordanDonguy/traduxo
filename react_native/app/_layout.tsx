import React from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import AppProvider from "@/contexts/AppProvider";
import { AppProviderBase } from "@traduxo/packages/contexts/AppContext";
import "./global.css";
import AppHeader from "@/components/menu/AppHeader";
import { useFonts } from "expo-font";
import LoadingAnimation from "@/components/main-section/LoadingAnimation";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function RootLayout() {
  const insets = useSafeAreaInsets();
  
  const [fontsLoaded] = useFonts({
    "OpenSans-Regular": require("../assets/fonts/OpenSans-Regular.ttf"),
  });

  if (!fontsLoaded) return (
    <View className="flex-1 mb-60 flex justify-center">
      <LoadingAnimation />
    </View>
  )


  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProviderBase>
        <AppProvider>

          <Stack
            screenOptions={{
              header: () => (
                <AppHeader />
              ),
              contentStyle: {
                flex: 1
              },
            }}
          />

          <View className="dark:bg-zinc-950" style={{ height: insets.bottom }} />

        </AppProvider>
      </AppProviderBase>
    </GestureHandlerRootView>
  );
}

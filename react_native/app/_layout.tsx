import React from "react";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import AppProvider from "./contexts/AppProvider";
import { AppProviderBase } from "@traduxo/packages/contexts/AppContext";
import "./global.css";
import AppHeader from "./components/AppHeader";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProviderBase>
        <AppProvider>
          <Stack
            screenOptions={{
              header: () => (
                <SafeAreaView>
                  <AppHeader />
                </SafeAreaView>
              ),
              contentStyle: {
                flex: 1,
              },
            }}
          />
        </AppProvider>
      </AppProviderBase>
    </GestureHandlerRootView>
  );
}

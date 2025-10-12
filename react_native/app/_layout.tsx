import React from "react";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import AppProvider from "./contexts/AppProvider";
import { AppProviderBase } from "@traduxo/packages/contexts/AppContext";
import "./global.css";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
        <AppProviderBase>
          <AppProvider>
            <Stack />
          </AppProvider>
        </AppProviderBase>
    </GestureHandlerRootView>
  );
}

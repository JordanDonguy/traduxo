import React, { ReactNode } from "react";
import { AppProviderBase } from "@traduxo/packages/contexts/AppContext";
import {
  ThemeProvider,
  DefaultTheme,
  DarkTheme,
  Theme,
} from "@react-navigation/native";
import { useColorScheme } from "react-native";
import Toast from "react-native-toast-message";

export default function AppProvider({ children }: { children: ReactNode }) {
  const colorScheme = useColorScheme();
  const theme: Theme = colorScheme === "dark" ? DarkTheme : DefaultTheme;

  return (
    <AppProviderBase>
      <ThemeProvider value={theme}>
        {children}
        <Toast />
      </ThemeProvider>
    </AppProviderBase>
  );
}

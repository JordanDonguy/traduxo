import React, { ReactNode } from "react";
import { AppProviderBase } from "@traduxo/packages/contexts/AppContext";
import { ThemeProvider } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { AppThemeProvider, useAppTheme } from "./ThemeContext";

export default function AppProvider({ children }: { children: ReactNode }) {
  return (
    <AppProviderBase>
      <AppThemeProvider>
        <ThemeProviderWrapper>{children}</ThemeProviderWrapper>
      </AppThemeProvider>
      <Toast />
    </AppProviderBase>
  );
}

// Wrapper to connect navigation ThemeProvider with our custom theme
function ThemeProviderWrapper({ children }: { children: ReactNode }) {
  const { theme } = useAppTheme();
  return <ThemeProvider value={theme}>{children}</ThemeProvider>;
}

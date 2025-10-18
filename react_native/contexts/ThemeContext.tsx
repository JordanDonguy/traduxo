import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { DefaultTheme, DarkTheme, Theme } from "@react-navigation/native";
import { useColorScheme as useSystemColorScheme } from "react-native";
import { colorScheme } from "nativewind"; // ✅ from NativeWind
import { View } from "react-native";

interface ThemeContextProps {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useAppTheme must be used within a ThemeProvider");
  return context;
};

export function AppThemeProvider({ children }: { children: ReactNode }) {
  // Detect system preference on first render
  const systemScheme = useSystemColorScheme();
  const [isDark, setIsDark] = useState(systemScheme === "dark");

  // Keep navigation theme in sync
  const theme = isDark ? DarkTheme : DefaultTheme;

  // Sync with NativeWind color scheme
  useEffect(() => {
    colorScheme.set(isDark ? "dark" : "light");
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {/* Root view gets className="dark" when dark mode is active */}
      <View className={`flex-1 ${isDark ? "dark" : ""}`}>
        {children}
      </View>
    </ThemeContext.Provider>
  );
}

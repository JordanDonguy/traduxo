import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import { MotiView } from 'moti';
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useAuth } from "@traduxo/packages/contexts/AuthContext";
import { useAuthHandlers } from "@traduxo/packages/hooks/auth/useAuthHandlers";
import { useApp } from "@traduxo/packages/contexts/AppContext";
import { useTheme } from "@react-navigation/native";
import { useAppTheme } from "@/contexts/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useScrollGradient } from "@/hooks/useScrollGradient";
import TopGradient from "./TopGradient";
import LoadingSpinner from "./LoadingSpinner";
import Login from "./Login";
import TranslationHistory from "./TranslationHistory";

import {
  Moon,
  Sun,
  User,
  LogOut,
  Lock,
  CircleArrowLeft,
  CircleX,
  BadgeMinus,
  History,
  Star,
  Languages,
  Shield,
} from "lucide-react-native";

export default function UserMenu() {
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();
  const { theme, toggleTheme } = useAppTheme();

  const {
    showLoginForm,
    setShowLoginForm,
    showMenu,
    setShowMenu,
    currentSubmenu,
    setCurrentSubmenu
  } = useApp();

  const { status, providers, refresh } = useAuth();
  const { handleLogout } = useAuthHandlers();
  const isCredentials = providers?.includes("Credentials");

  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);

  const { showTopGradient, onScroll } = useScrollGradient();

  // Reset submenu if menu is closed
  useEffect(() => {
    let timeout: number;
    if (!showMenu) {
      timeout = setTimeout(() => {
        setCurrentSubmenu(null);
      }, 450);
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [showMenu]);


  // Open login if global state is true
  useEffect(() => {
    if (showLoginForm) {
      setCurrentSubmenu("login")
      setShowLoginForm(false);
    }
  }, [showLoginForm, setShowLoginForm]);

  return (
    <MotiView
      from={{ opacity: 0, translateX: -1000 }}
      animate={{ opacity: showMenu ? 1 : 0, translateX: showMenu ? 0 : -1000 }}
      transition={{
        type: 'spring',
        damping: 20,
        stiffness: 150,
        mass: 1,
      }}
      style={{ transformOrigin: 'left', pointerEvents: showMenu ? "auto" : "none" }}
      className={`absolute inset-0 z-40 h-screen pt-4 justify-center bg-white dark:bg-zinc-950`}
    >

      <View className="z-50 w-full flex-1 rounded-xl self-center px-4">

        {/* Back / Close buttons */}
        <View className="z-50 flex-row justify-between items-center w-full py-4 mb-4">
          {currentSubmenu && (
            <TouchableOpacity onPress={() => setCurrentSubmenu(null)} className="z-50">
              <CircleArrowLeft size={28} color={colors.text} />
            </TouchableOpacity>
          )}
          <Text className="text-xl text-black dark:text-white font-semibold">
            {currentSubmenu ? currentSubmenu : "User Settings"}
          </Text>
          <TouchableOpacity onPress={() => setShowMenu(false)} className="z-50">
            <CircleX size={28} color={colors.text} />
          </TouchableOpacity>
        </View>


        {isLoading ? <LoadingSpinner /> :
          (currentSubmenu === "Login" || currentSubmenu === "Signup") ? (
            <Login currentSubmenu={currentSubmenu} setCurrentSubmenu={setCurrentSubmenu} />
          ) : currentSubmenu === "History" ? (
            <TranslationHistory />
          ) : (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
              onScroll={onScroll}
              scrollEventThrottle={16}
              className="flex-1 w-full mb-24"
            >
              {/* Theme toggle */}
              <TouchableOpacity
                className="flex-row items-center h-20 w-full px-4 rounded-xl bg-zinc-200 dark:bg-zinc-800 mb-4"
                onPress={() => toggleTheme()}
              >
                {theme.dark ? <Moon size={28} color={colors.text} /> : <Sun size={28} color={colors.text} />}
                <Text className="ml-3 text-lg text-black dark:text-white">Theme ({theme.dark ? "Dark" : "Light"})</Text>
              </TouchableOpacity>

              {/* Explanation language */}
              <TouchableOpacity
                className="flex-row items-center h-20 w-full px-4 rounded-xl bg-zinc-200 dark:bg-zinc-800 mb-4"
                onPress={() => setCurrentSubmenu("Explanation Language")}
              >
                <Languages size={28} color={colors.text} />
                <Text className="ml-3 text-lg text-black dark:text-white">Explanation language</Text>
              </TouchableOpacity>

              {/* Login */}
              {status !== "authenticated" && (
                <TouchableOpacity
                  className="flex-row items-center h-20 w-full px-4 rounded-xl bg-zinc-200 dark:bg-zinc-800 mb-4"
                  onPress={() => setCurrentSubmenu("Login")}
                >
                  <User size={28} color={colors.text} />
                  <Text className="ml-3 text-lg text-black dark:text-white">Login</Text>
                </TouchableOpacity>
              )}

              {/* History */}
              <TouchableOpacity
                className="flex-row items-center h-20 w-full px-4 rounded-xl bg-zinc-200 dark:bg-zinc-800 mb-4"
                onPress={() => setCurrentSubmenu("History")}
              >
                <History size={28} color={colors.text} />
                <Text className="ml-3 text-lg text-black dark:text-white">History</Text>
              </TouchableOpacity>

              {/* Favorites */}
              <TouchableOpacity
                className="flex-row items-center h-20 w-full px-4 rounded-xl bg-zinc-200 dark:bg-zinc-800 mb-4"
                onPress={() => setCurrentSubmenu("Favorites")}
              >
                <Star size={28} color={colors.text} />
                <Text className="ml-3 text-lg text-black dark:text-white">Favorites</Text>
              </TouchableOpacity>

              {/* Privacy policy */}
              <TouchableOpacity
                className="flex-row items-center h-20 w-full px-4 rounded-xl bg-zinc-200 dark:bg-zinc-800 mb-4"
              /* onPress={() => router.push("/privacy")} */
              >
                <Shield size={28} color={colors.text} />
                <Text className="ml-3 text-lg text-black dark:text-white">Privacy policy</Text>
              </TouchableOpacity>

              {/* Authenticated actions */}
              {status === "authenticated" && (
                <>
                  {/* Change password */}
                  <TouchableOpacity
                    className="flex-row items-center h-20 w-full px-4 rounded-xl bg-zinc-200 dark:bg-zinc-800 mb-4"
                    onPress={() => setCurrentSubmenu("Change Password")}
                  >
                    <Lock size={28} color={colors.text} />
                    <Text className="ml-3 text-lg text-black dark:text-white">{isCredentials ? "Change password" : "Create password"}</Text>
                  </TouchableOpacity>

                  {/* Logout */}
                  <TouchableOpacity
                    className="flex-row items-center h-20 w-full px-4 rounded-xl bg-zinc-200 dark:bg-zinc-800 mb-4"
                    onPress={async () => {
                      setIsLoading(true);
                      const success = await handleLogout(refresh, setIsLoading);
                      if (success) setShowMenu(false);
                    }}
                  >
                    <LogOut size={28} color={colors.text} />
                    <Text className="ml-3 text-lg text-black dark:text-white">Log Out</Text>
                  </TouchableOpacity>

                  {/* Delete account */}
                  <TouchableOpacity
                    className="flex-row items-center h-20 w-full px-4 rounded-xl bg-zinc-200 dark:bg-zinc-800 mb-4"
                    onPress={() => setCurrentSubmenu("Delete Account")}
                  >
                    <BadgeMinus size={28} color={colors.text} />
                    <Text className="ml-3 text-lg text-black dark:text-white">Delete account</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          )}

        <TopGradient show={showTopGradient} />

        <LinearGradient
          colors={dark ? ['rgba(0,0,0,0.0)', 'rgba(0,0,0,0.5)'] : ['rgba(255,255,255,0.0)', 'rgba(255,255,255,0.6)']}
          style={{ position: 'absolute', bottom: insets.bottom + 40, left: 0, right: 0, height: 30, zIndex: 50 }}
        />

      </View >
    </MotiView >
  );
}

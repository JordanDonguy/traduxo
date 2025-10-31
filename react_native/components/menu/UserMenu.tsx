import React, { useEffect, useState } from "react";
import { View, ScrollView, TouchableOpacity } from "react-native";
import AppText from "../AppText";
import { MotiView } from 'moti';
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@traduxo/packages/contexts/AuthContext";
import { useAuthHandlers } from "@traduxo/packages/hooks/auth/useAuthHandlers";
import { useApp } from "@traduxo/packages/contexts/AppContext";
import { useTheme } from "@react-navigation/native";
import { useAppTheme } from "@/contexts/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useScrollGradient } from "@/hooks/useScrollGradient";
import Toast from "react-native-toast-message";
import MenuButton from "./MenuButton";
import TopGradient from "./TopGradient";
import LoadingSpinner from "./LoadingSpinner";
import Login from "./Login";
import TranslationHistory from "./TranslationHistory";
import Favorites from "./Favorites";
import ExplanationLanguage from "./ExplanationLanguage";
import PrivacyPolicy from "./PrivacyPolicy";
import ChangePassword from "./ChangePassword";
import DeleteAccount from "./DeleteAccount";

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

  const [isLoading, setIsLoading] = useState(false);

  const { showTopGradient, setShowTopGradient, onScroll } = useScrollGradient();

  // Reset submenu if menu is closed
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    if (!showMenu) {
      timeout = setTimeout(() => {
        setCurrentSubmenu(null);
      }, 450);
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [showMenu, setCurrentSubmenu]);


  // Open login if global state is true
  useEffect(() => {
    if (showLoginForm) {
      setCurrentSubmenu("login")
      setShowLoginForm(false);
    }
  }, [showLoginForm, setShowLoginForm, setCurrentSubmenu]);

  // Remove Top Gradient when going into a submenu
  useEffect(() => {
    if (currentSubmenu) setShowTopGradient(false);
  }, [currentSubmenu, setShowTopGradient])

  return (
    <MotiView
      from={{ opacity: 0, translateX: -400 }}
      animate={{ opacity: showMenu ? 1 : 0, translateX: showMenu ? 0 : -400 }}
      transition={{
        type: 'spring',
        damping: 20,
        stiffness: 250,
        mass: 0.6,
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
          <AppText className="text-xl font-semibold">
            {currentSubmenu ? currentSubmenu : "User Settings"}
          </AppText>
          <TouchableOpacity onPress={() => setShowMenu(false)} className="z-50">
            <CircleX size={28} color={colors.text} />
          </TouchableOpacity>
        </View>


        {isLoading ? <LoadingSpinner paddingBottom="20" /> :
          (currentSubmenu === "Login" || currentSubmenu === "Signup") ? (
            <Login currentSubmenu={currentSubmenu} setCurrentSubmenu={setCurrentSubmenu} />
          ) : currentSubmenu === "History" ? (
            <TranslationHistory />
          ) : currentSubmenu === "Favorites" ? (
            <Favorites />
          ) : currentSubmenu === "Explanation Language" ? (
            <ExplanationLanguage />
          ) : currentSubmenu === "Privacy Policy" ? (
            <PrivacyPolicy />
          ) : (currentSubmenu === "Change Password" || currentSubmenu === "Create Password") ? (
            <ChangePassword isCredentials={isCredentials} />
          ) : currentSubmenu === "Delete Account" ? (
            <DeleteAccount />
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
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
                <AppText className="ml-3 text-lg">Theme ({theme.dark ? "Dark" : "Light"})</AppText>
              </TouchableOpacity>

              {/* Explanation language */}
              <MenuButton label="Explanation Language" icon={Languages} />

              {/* Login */}
              {status !== "authenticated" && (
                <MenuButton label="Login" icon={User} />
              )}

              {/* History */}
              <MenuButton label="History" icon={History} />

              {/* Favorites */}
              <MenuButton label="Favorites" icon={Star} />

              {/* Privacy policy */}
              <MenuButton label="Privacy Policy" icon={Shield} />

              {/* Authenticated actions */}
              {status === "authenticated" && (
                <>
                  {/* Change password */}
                  <MenuButton label={isCredentials ? "Change Password" : "Create Password"} icon={Lock} />

                  {/* Logout */}
                  <TouchableOpacity
                    className="flex-row items-center h-20 w-full px-4 rounded-xl bg-zinc-200 dark:bg-zinc-800 mb-4"
                    onPress={async () => {
                      setIsLoading(true);
                      const success = await handleLogout(refresh, setIsLoading);
                      if (success) {
                        Toast.show({ text1: "Successfully logged out! See you soon 😉", text1Style: ({ fontSize: 14 }) });
                        setShowMenu(false)
                      };
                    }}
                  >
                    <LogOut size={28} color={colors.text} />
                    <AppText className="ml-3 text-lg">Log Out</AppText>
                  </TouchableOpacity>

                  {/* Delete account */}
                  <MenuButton label="Delete Account" icon={BadgeMinus} />

                </>
              )}
            </ScrollView>
          )}

        <TopGradient show={showTopGradient} />

        <LinearGradient
          colors={dark ? ['rgba(0,0,0,0.0)', 'rgba(0,0,0,0.5)'] : ['rgba(255,255,255,0.0)', 'rgba(255,255,255,0.6)']}
          style={{ position: 'absolute', bottom: insets.bottom + 40, left: 0, right: 0, height: 30, zIndex: 50 }}
          pointerEvents="none"
        />

      </View >
    </MotiView >
  );
}

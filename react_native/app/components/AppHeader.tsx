import React, { useEffect } from "react";
import { View, TouchableOpacity } from "react-native";
import { useTheme } from "@react-navigation/native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useApp } from "@traduxo/packages/contexts/AppContext";
import { useAuth } from "@traduxo/packages/contexts/AuthContext";
import { useSuggestion } from "@traduxo/packages/hooks/suggestion/useSuggestion";
import { Dices, User } from "lucide-react-native";
import Toast from "react-native-toast-message";
import Logo from "./Logo";

export default function AppHeader() {
  const { colors } = useTheme();
  const router = useRouter();
  const searchParams = useLocalSearchParams();
  const submenu = searchParams.submenu as string | undefined; // e.g. ?submenu=login

  const { showMenu, setShowMenu } = useApp();
  const { refresh } = useAuth();
  const { suggestTranslation, isRolling } = useSuggestion({});

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <View className="w-full flex items-center">
      {/* TODO: Add UserMenu if needed */}
      {/* {showMenu && <UserMenu submenu={submenu} />} */}

      <View className="border-b border-border-light dark:border-border-dark z-50 w-full h-16 flex flex-row items-center justify-between px-4 shadow-sm">
        {/* User menu toggle */}
        <TouchableOpacity
          onPress={() => {
            setShowMenu(!showMenu);
            router.push(!showMenu ? "/?menu=open" : "/");
          }}
          className="p-2 rounded-full active:opacity-70"
        >
          <User size={32} color={colors.text} />
        </TouchableOpacity>

        <Logo />

        {/* Suggest expression button */}
        <TouchableOpacity
          onPress={() => {
            router.push("/"); // go to home
            suggestTranslation();
          }}
          className="p-2 rounded-full active:opacity-70"
        >
          <Dices size={32} color={colors.text} />
        </TouchableOpacity>

      </View>

      <Toast />
    </View>
  );
}

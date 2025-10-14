import React, { useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, TouchableOpacity } from "react-native";
import { useTheme } from "@react-navigation/native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useApp } from "@traduxo/packages/contexts/AppContext";
import { useAuth } from "@traduxo/packages/contexts/AuthContext";
import { useSuggestion } from "@traduxo/packages/hooks/suggestion/useSuggestion";
import { Dices, User } from "lucide-react-native";
import { LinearGradient } from 'expo-linear-gradient';
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
    <SafeAreaView edges={["top"]} className="bg-white dark:bg-black">
      <View className="relative w-full">
        {/* Header */}
        <View className="border-b border-zinc-200 dark:border-zinc-400 z-50 w-full h-16 flex flex-row items-center justify-between px-4">
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

        {/* Gradient fade at bottom of header */}
        <LinearGradient
          colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0)']}
          style={{
            position: 'absolute',
            top: 54,
            left: 0,
            right: 0,
            height: 30,
            zIndex: 40,
          }}
        />
      </View>
    </SafeAreaView>
  );
}

import React, { useEffect, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, TouchableOpacity, Animated, Easing } from "react-native";
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
  const submenu = searchParams.submenu as string | undefined;

  const { showMenu, setShowMenu } = useApp();
  const { refresh } = useAuth();
  const { suggestTranslation } = useSuggestion({});

  const rotation = useRef(new Animated.Value(0)).current;
  
  // Interpolate rotation value to degrees
  const rotateInterpolate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "1440deg"], // 4 full spins
  });
  
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
              rotation.setValue(0);
              Animated.timing(rotation, {
                toValue: 1,
                duration: 900,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
              }).start();

              suggestTranslation();
            }}
            className="p-2 rounded-full active:opacity-70"
          >
            <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
              <Dices size={32} color={colors.text} />
            </Animated.View>
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

import React, { useEffect, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, TouchableOpacity, Animated, Easing, BackHandler, Keyboard } from "react-native";
import { useTheme } from "@react-navigation/native";
import { useApp } from "@traduxo/packages/contexts/AppContext";
import { useAuth } from "@traduxo/packages/contexts/AuthContext";
import { useSuggestion } from "@traduxo/packages/hooks/suggestion/useSuggestion";
import { blurActiveInput } from "@traduxo/packages/utils/ui/blurActiveInput";
import { Dices, User } from "lucide-react-native";
import { LinearGradient } from 'expo-linear-gradient';
import Logo from "../Logo";

export default function AppHeader() {
  const { colors, dark } = useTheme();
  const { showMenu, setShowMenu, currentSubmenu, setCurrentSubmenu } = useApp();
  const { refresh } = useAuth();
  const { suggestTranslation } = useSuggestion({});

  const rotation = useRef(new Animated.Value(0)).current;

  // Animate dice rotation
  const rotateInterpolate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "1440deg"],
  });

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Handle hardware back button
  useEffect(() => {
    const backAction = () => {
      if (currentSubmenu) {
        setCurrentSubmenu(null);
        return true; // consumed
      }
      if (showMenu) {
        setShowMenu(false);
        return true;
      }
      return false; // let OS handle it
    };

    const subscription = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => subscription.remove();
  }, [currentSubmenu, showMenu, setShowMenu]);

  return (
    <SafeAreaView edges={["top"]} className="bg-white dark:bg-black">
      <View className="relative w-full">
        {/* Header */}
        <View className="border-b border-zinc-400 z-50 w-full h-16 flex flex-row items-center justify-between px-4">
          <TouchableOpacity
            onPress={() => setShowMenu(prev => !prev)}
            className="p-2 rounded-full active:opacity-70"
          >
            <User size={32} color={colors.text} />
          </TouchableOpacity>

          <Logo />

          <TouchableOpacity
            onPress={() => {
              rotation.setValue(0);
              Animated.timing(rotation, {
                toValue: 1,
                duration: 900,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
              }).start();
              blurActiveInput(Keyboard);
              suggestTranslation();
              setShowMenu(false)
            }}
            className="p-2 rounded-full active:opacity-70"
          >
            <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
              <Dices size={32} color={colors.text} />
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Gradient fade */}
        <LinearGradient
          colors={dark ? ['rgba(0,0,0,0.5)', 'rgba(0,0,0,0)'] : ['rgba(255,255,255,0.5)', 'rgba(255,255,255,0)']}
          style={{ position: 'absolute', top: 54, left: 0, right: 0, height: 30, zIndex: 40 }}
        />

      </View>
    </SafeAreaView>
  );
}

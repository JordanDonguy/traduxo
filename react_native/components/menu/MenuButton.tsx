import React from "react";
import { TouchableOpacity } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import AppText from "../AppText";
import { useTheme } from "@react-navigation/native";
import { useApp } from "@traduxo/packages/contexts/AppContext";

interface MenuButtonProps {
  label: string;
  icon: LucideIcon;
}

const MenuButton = ({ label, icon: IconComponent }: MenuButtonProps) => {
  const { setCurrentSubmenu } = useApp();
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessible={true}
      className="flex-row items-center h-20 w-full px-4 rounded-xl bg-zinc-200 dark:bg-zinc-800 mb-4"
      onPress={() => setCurrentSubmenu(label)}
    >
      <IconComponent size={28} color={colors.text} />
      <AppText className="ml-3 text-lg">{label}</AppText>
    </TouchableOpacity>
  );
};

export default MenuButton;

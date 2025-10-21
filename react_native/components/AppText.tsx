import React from "react";
import { Text, TextProps } from "react-native";

export default function AppText({
  className = "",
  ...props
}: TextProps & { className?: string }) {
  return (
    <Text
      {...props}
      className={`text-black dark:text-white ${className}`}
    />
  );
}

import { View } from "react-native";
import { MotiView } from "moti";

export default function LoadingSpinner() {
  return (
    <View className="absolute h-screen-safe pb-48 inset-0 bg-white dark:bg-zinc-950 z-50 flex items-center justify-center">
      <MotiView
        from={{ rotate: "0deg" }}
        animate={{ rotate: "360deg" }}
        transition={{
          type: "timing",
          duration: 1000,
          loop: true,
          repeatReverse: false,
        }}
        className="w-40 h-40 border-8 border-zinc-400 dark:border-zinc-500 border-t-zinc-200 dark:border-t-zinc-200 rounded-full"
      />
    </View>
  )
}

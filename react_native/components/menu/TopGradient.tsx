import { LinearGradient } from "expo-linear-gradient"
import { useScrollGradient } from "@/hooks/useScrollGradient"
import { useTheme } from "@react-navigation/native";
import { MotiView } from "moti"

// TopGradient.tsx
export default function TopGradient({ show }: { show: boolean }) {
  const { dark } = useTheme();

  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: show ? 1 : 0 }}
      transition={{ type: "timing", duration: 400 }}
      style={{
        position: "absolute",
        top: 70,
        left: 0,
        right: 0,
        height: 30,
        zIndex: 50,
      }}
    >
      <LinearGradient
        colors={
          dark
            ? ["rgba(0,0,0,0.5)", "rgba(0,0,0,0)"]
            : ["rgba(255,255,255,0.7)", "rgba(255,255,255,0)"]
        }
        style={{ flex: 1 }}
      />
    </MotiView>
  );
}


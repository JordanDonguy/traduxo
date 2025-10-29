import { useState, useEffect } from "react";
import { MotiView } from "moti";
import { CircleStop } from "lucide-react-native";
import { View } from "react-native";
import { useTheme } from "@react-navigation/native";

export default function StopIcon() {
  const [animateToBig, setAnimateToBig] = useState(true);
  const { dark } = useTheme();

  // Toggle animation state every 800ms
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimateToBig((prev) => !prev);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  // Softer glow in light mode, stronger in dark
  const glowColor = dark
    ? "rgba(209,38,38,0.5)" // deeper, more visible glow for dark background
    : "rgba(209,38,38,0.2)"; // lighter glow for light background

  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      {/* Adaptive glow ring */}
      <MotiView
        from={{ scale: 1, opacity: 0.6 }}
        animate={
          animateToBig
            ? { scale: 2.2, opacity: 0 }
            : { scale: 0.9, opacity: 0.5 }
        }
        transition={{
          type: "timing",
          duration: 800,
        }}
        style={{
          position: "absolute",
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: glowColor,
        }}
      />

      {/* Main pulsing stop icon */}
      <MotiView
        from={{ scale: 1.1, opacity: 1 }}
        animate={
          animateToBig
            ? { scale: 1.4, opacity: 0.9 }
            : { scale: 1.1, opacity: 1 }
        }
        transition={{
          type: "timing",
          duration: 800,
        }}
      >
        <CircleStop size={28} color="rgb(209,38,38)" />
      </MotiView>
    </View>
  );
}

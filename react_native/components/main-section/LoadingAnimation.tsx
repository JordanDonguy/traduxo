import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";

export default function LoadingAnimation() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const bounce = (anim: Animated.Value, delay: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: -10,
            duration: 300,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    bounce(dot1, 0);
    bounce(dot2, 150);
    bounce(dot3, 300);
  }, [dot1, dot2, dot3]);

  const Dot = (anim: Animated.Value) => (
    <Animated.View
      style={[
        styles.dot,
        { transform: [{ translateY: anim }] },
      ]}
    />
  );

  return (
    <View style={styles.container}>
      {Dot(dot1)}
      {Dot(dot2)}
      {Dot(dot3)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    gap: 12,
    height: 28,
    marginTop: 16,
  },
  dot: {
    width: 16,
    height: 16,
    backgroundColor: "#9c9c9c",
    borderRadius: 8,
  },
});

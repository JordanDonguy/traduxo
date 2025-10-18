import { useState, useCallback } from "react";
import { NativeSyntheticEvent, NativeScrollEvent } from "react-native";

export function useScrollGradient(threshold = 10) {
  const [showTopGradient, setShowTopGradient] = useState(false);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = e.nativeEvent.contentOffset.y;
      setShowTopGradient(offsetY > threshold);
    },
    [threshold]
  );

  return { showTopGradient, onScroll };
}

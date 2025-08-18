"use client"

import { useState, useEffect } from "react";

// This hook makes a one minute cooldown when triggered
export function useCooldown(start: boolean) {
  const [count, setCount] = useState(60);

  useEffect(() => {
    if (!start) {
      setCount(0);
      return;
    }
    if (count === 0) setCount(60);

    const interval = setInterval(() => {
      setCount(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [start, count]);

  return count;
}

import React, { useRef, useEffect } from "react";
import { View, TouchableOpacity } from "react-native";
import AppText from "../AppText";
import { useCooldown } from "@traduxo/packages/hooks/ui/useCooldown";
import { useApp } from "@traduxo/packages/contexts/AppContext";
import { formatError } from "@traduxo/packages/utils/formatting/formatError";

type ErrorSectionProps = {
  error: string;
  setError: React.Dispatch<React.SetStateAction<string>>;
  isExplanationError: boolean
};

export default function ErrorSection({ isExplanationError, error, setError }: ErrorSectionProps) {
  const { setShowMenu, setCurrentSubmenu } = useApp();
  const errorToDisplay = formatError(error);
  const cooldown = useCooldown(errorToDisplay.startsWith("Too many requests"));

  // Reset error state when cooldown is down to 0 (for rate limiting errors)
  useEffect(() => {
    if (cooldown === 0 && errorToDisplay.startsWith("Too many requests")) {
      setError("");
    }
  }, [cooldown, errorToDisplay, setError]);


  // -------- Login button part --------
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLoginPress = () => {
    setShowMenu(true);
    setCurrentSubmenu("Login");

    timeoutRef.current = setTimeout(() => {
      setError("");
    }, 300);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <View
      className={`flex-1 flex flex-col justify-center 
        ${errorToDisplay.startsWith("To continue using") ? "gap-8" : "gap-2"}
        ${isExplanationError ? "mt-8" : "mb-48"}`}
    >

      {/* ---- Render error message ---- */}
      <AppText className="text-xl text-center px-4 break-words">
        {errorToDisplay}
      </AppText>

      {/* ---- Display login button for errors requiring user to login ---- */}
      {errorToDisplay.startsWith("To continue using") && (
        <TouchableOpacity
          onPress={handleLoginPress}
          className="bg-zinc-200 dark:bg-zinc-800 rounded-full h-16 flex items-center justify-center mx-2"
        >
          <AppText className="text-xl font-medium">Login</AppText>
        </TouchableOpacity>
      )}

      {/* ---- Display cooldown for rate limiting errors ---- */}
      {cooldown && cooldown > 0 ? (
        <AppText className="text-xl text-center px-4 break-words">
          Try again in 0:{String(cooldown).padStart(2, "0")} 🙏
        </AppText>
      ) : null}
    </View>
  );
}

"use client"

import { useState } from "react";
import { useTranslationContext } from "@/context/TranslationContext";
import { useAuth, AuthContextType } from "@traduxo/packages/contexts/AuthContext";
import { toast } from "react-toastify";
import { addToFavorite, deleteFromFavorite } from "@/lib/client/utils/favorites/favorites";

// Injected dependencies for testing
type UseFavoriteToggleArgs = {
  session?: AuthContextType;
  addToFavoriteFn?: typeof addToFavorite;
  deleteFromFavoriteFn?: typeof deleteFromFavorite;
  toaster?: typeof toast;
};

export function useFavoriteToggle({
  session,
  addToFavoriteFn = addToFavorite,
  deleteFromFavoriteFn = deleteFromFavorite,
  toaster = toast,
}: UseFavoriteToggleArgs = {}) {
  // ---- Step 1: Context + session + router ----
  const {
    translationId,
    setTranslationId,
    translatedText,
    inputTextLang,
    translatedTextLang,
    isFavorite,
    setIsFavorite,
  } = useTranslationContext();


  // ---- Step 2: Local loading state ----
  const [isFavLoading, setIsFavLoading] = useState(false);
  // --- Always call hooks unconditionally ---
  const defaultSession = useAuth();

  // --- Use injected values for testing if provided ---
  const effectiveSession = session ?? defaultSession;
  const { status, token } = effectiveSession;

  // ---- Step 3: Toggle favorite handler ----
  async function handleFavorite() {
    // Prevent double-click spamming
    if (isFavLoading) return;
    setIsFavLoading(true);

    try {
      if (status !== "authenticated") {
        toaster.error("You need to be logged in to add translations to favorites.");
        setIsFavLoading(false);
        return;
      }

      if (isFavorite) {
        // ---- Step 3a: Delete favorite ----
        await deleteFromFavoriteFn(translationId, setTranslationId, setIsFavorite, token);
      } else {
        // ---- Step 3b: Add favorite ----
        const res = await addToFavoriteFn(
          translatedText,
          inputTextLang,
          translatedTextLang,
          setTranslationId,
          setIsFavorite,
          token
        );
        if (res) toaster.error(res); // API returned an error message
      }
      return true;
    } catch (err) {
      console.error("Favorite toggle failed:", err);
      return false;
    } finally {
      setIsFavLoading(false);
    }
  }

  return { handleFavorite, isFavLoading };
}

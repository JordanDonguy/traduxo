"use client"

import { useState } from "react";
import { useTranslationContext } from "@/context/TranslationContext";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { addToFavorite, deleteFromFavorite } from "@/lib/client/utils/favorites";

// Injected dependencies for testing
type UseFavoriteToggleArgs = {
  session?: ReturnType<typeof useSession>;
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

  // --- Always call hooks unconditionally ---
  const defaultSession = useSession();

  // --- Use injected values for testing if provided ---
  const effectiveSession = session ?? defaultSession;
  const { status } = effectiveSession;

  // ---- Step 2: Local loading state ----
  const [isFavLoading, setIsFavLoading] = useState(false);

  // ---- Step 3: Toggle favorite handler ----
  async function handleFavorite() {
    // Prevent double-click spamming
    if (isFavLoading) return;
    setIsFavLoading(true);

    try {
      if (status !== "authenticated") {
        toaster.error("You need to be logged in to add translations to favorites.")
        return;
      }

      if (isFavorite) {
        // ---- Step 3a: Delete favorite ----
        await deleteFromFavoriteFn(translationId, setTranslationId, setIsFavorite);
      } else {
        // ---- Step 3b: Add favorite ----
        const res = await addToFavoriteFn(
          translatedText,
          inputTextLang,
          translatedTextLang,
          setTranslationId,
          setIsFavorite
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

  // ---- Step 4: Expose API ----
  return { handleFavorite, isFavLoading };
}

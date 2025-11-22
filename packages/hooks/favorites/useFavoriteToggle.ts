import { useState } from "react";
import { useTranslationContext } from "@traduxo/packages/contexts/TranslationContext";
import { useAuth } from "@traduxo/packages/contexts/AuthContext";
import { addToFavorite, deleteFromFavorite } from "@traduxo/packages/utils/favorites/favorites";

// Injected dependencies for testing
type UseFavoriteToggleArgs = {
  addToFavoriteFn?: typeof addToFavorite;
  deleteFromFavoriteFn?: typeof deleteFromFavorite;
};

export function useFavoriteToggle({
  addToFavoriteFn = addToFavorite,
  deleteFromFavoriteFn = deleteFromFavorite,
}: UseFavoriteToggleArgs = {}) {
  // ---- Step 1: Get context and depencencies ----
  const {
    translationId,
    setTranslationId,
    translatedText,
    inputTextLang,
    translatedTextLang,
    isFavorite,
    setIsFavorite,
  } = useTranslationContext();
  const { status, token } = useAuth();

  // ---- Step 2: Local loading state ----
  const [isFavLoading, setIsFavLoading] = useState(false);

  // ---- Step 3: Toggle favorite handler ----
  async function handleFavorite() {
    // Prevent double-click spamming
    if (isFavLoading) return { success: false, message: "Loading..."};
    setIsFavLoading(true);

    try {
      if (status !== "authenticated") {
        setIsFavLoading(false);
        return { success: false, message: "You need to be logged in to add translations to favorites." };
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
        if (res) return { success: false, message: res }; // API returned an error message
      }
      return { success: true };
    } catch (err) {
      console.error("Favorite toggle failed:", err);
      return { success: false, message: "Error adding or deleting translation from favorites"};
    } finally {
      setIsFavLoading(false);
    }
  }

  return { handleFavorite, isFavLoading };
}

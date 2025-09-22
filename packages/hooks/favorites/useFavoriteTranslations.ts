import { useEffect, useState } from "react";
import { useAuth, AuthContextType } from "@traduxo/packages/contexts/AuthContext";
import { toast } from "react-toastify";
import { useTranslationContext } from "@traduxo/packages/contexts/TranslationContext";
import { Translation } from "@traduxo/packages/types/translation";
import { API_BASE_URL } from "@traduxo/packages/utils/config/apiBase";

// Injected dependencies for testing
type UseFavoriteTranslationsArgs = {
  fetcher?: typeof fetch;
  toaster?: typeof toast;
};

export function useFavoriteTranslations({
  fetcher = fetch,
  toaster = toast,
}: UseFavoriteTranslationsArgs) {
  // ---- Step 1: Get dependencies ----
  const { translationId, setTranslationId, setIsFavorite } = useTranslationContext();
  const { status, token } = useAuth();

  // ---- Step 2: Local state for favorites and loading state ----
  const [favoriteTranslations, setFavoriteTranslations] = useState<Translation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // ---- Step 3: Delete a favorite translation (API + local state update) ----
  async function deleteTranslation(id: string) {
    // If current active translation is deleted → reset its state in UI
    if (translationId === id) {
      setTranslationId(undefined);
      setIsFavorite(false);
    }

    try {
      if (!token) return false;
      const res = await fetcher("/api/favorite", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        const data = await res.json().catch();
        throw new Error(data.error || "Failed to delete translation");
      }

      // Update local state to remove deleted translation
      setFavoriteTranslations((prev) => prev.filter((t) => t.id !== id));
      return true
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An error occurred";
      toaster.error(message);
      return false;
    }
  }

  // ---- Step 4: Fetch all favorites when user logs in ----
  useEffect(() => {
    if (status === "loading") return;
    if (status !== "authenticated" || !token) return setIsLoading(false);

    async function fetchData() {
      try {
        const res = await fetcher(`${API_BASE_URL}/favorite`, {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });

        if (res.status === 204) {
          // No favorites
          setFavoriteTranslations([]);
        } else if (res.ok) {
          const data = await res.json();
          setFavoriteTranslations(data);
        } else {
          console.error("Failed to fetch favorites:", res.statusText);
        }
      } catch (err) {
        console.error("Error fetching favorites:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [status, token, fetcher]);

  // ---- Step 5: Return everything needed by the component ----
  return {
    favoriteTranslations,
    isLoading,
    status,
    deleteTranslation,
  };
}

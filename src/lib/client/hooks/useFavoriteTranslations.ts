// hooks/useFavoriteTranslations.ts
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useTranslationContext } from "@/context/TranslationContext";
import { Translation } from "../../../../types/translation";

// Injected dependencies for testing
type UseFavoriteTranslationsArgs = {
  fetcher?: typeof fetch;
  router?: ReturnType<typeof useRouter>;
  session?: ReturnType<typeof useSession>;
  toaster?: typeof toast;
};

export function useFavoriteTranslations({
  fetcher = fetch,
  router,
  session,
  toaster = toast,
}: UseFavoriteTranslationsArgs = {}) {
  // ---- Step 1: Get dependencies from contexts + Next.js router/auth ----
  const { translationId, setTranslationId, setIsFavorite } = useTranslationContext();

  // --- Always call hooks unconditionally ---
  const defaultSession = useSession();
  const defaultRouter = useRouter();

  // --- Use injected values for testing if provided ---
  const effectiveSession = session ?? defaultSession;
  const { status } = effectiveSession;
  const effectiveRouter = router ?? defaultRouter;

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
      const res = await fetcher("/api/favorite", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete translation");
      }

      // Update local state to remove deleted translation
      setFavoriteTranslations((prev) => prev.filter((t) => t.id !== id));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "An error occurred";
      toaster.error(message);
      effectiveRouter.push("/");
    }
  }

  // ---- Step 4: Fetch all favorites when user logs in ----
  useEffect(() => {
    if (status === "loading") return;
    if (status !== "authenticated") return setIsLoading(false);

    async function fetchData() {
      try {
        const res = await fetcher("/api/favorite");

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
  }, [status, fetcher]);

  // ---- Step 5: Return everything needed by the component ----
  return {
    favoriteTranslations,
    isLoading,
    status,
    deleteTranslation,
  };
}

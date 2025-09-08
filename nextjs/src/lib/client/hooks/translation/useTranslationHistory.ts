"use client";

import { useState, useEffect } from "react";
import { useAuth, AuthContextType } from "@traduxo/packages/contexts/AuthContext";
import { toast } from "react-toastify";
import { useTranslationContext } from "@/context/TranslationContext";
import { fetchHistory } from "@/lib/client/utils/history/fetchHistory";
import { useSelectTranslation } from "./useSelectTranslation";
import { Translation } from "@traduxo/packages/types/translation";

// Injected dependencies for testing
type UseTranslationHistoryArgs = {
  session?: AuthContextType;
  fetcher?: typeof fetch;
  toaster?: typeof toast;
  selectTranslationHook?: ReturnType<typeof useSelectTranslation>;
};

export function useTranslationHistory({
  session,
  fetcher = fetch,
  toaster = toast,
  selectTranslationHook,
}: UseTranslationHistoryArgs = {}) {
  // ---- Step 1: Grab context/state ----
  const { translationHistory, setTranslationHistory } = useTranslationContext();
  const [isLoading, setIsLoading] = useState(true);

  // --- Always call hooks unconditionally ---
  const defaultSession = useAuth();
  const defaultSelectTranslationHook = useSelectTranslation();

  // --- Use injected values for testing if provided ---
  const effectiveSession = session ?? defaultSession;
  const { status, token } = effectiveSession;
  const { selectTranslation } = selectTranslationHook ?? defaultSelectTranslationHook;

  // ---- Step 2: Delete handler ----
  async function deleteTranslation(id: string) {
    try {
      const res = await fetcher("/api/history", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}), // only add if token exists
        },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete translation");
      }

      setTranslationHistory((prev) => prev.filter((t) => t.id !== id));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      toaster.error(message);
      return false;
    }
  }

  // ---- Step 3: Fetch history on mount ----
  useEffect(() => {
    const load = async () => {
      await fetchHistory({ status, token, setTranslationHistory });
      setIsLoading(false);
    };
    load();
  }, [status, token, setTranslationHistory]);

  return {
    translationHistory,
    isLoading,
    status,
    deleteTranslation,
    selectTranslation: (t: Translation) => selectTranslation(t, false), // false = not favorite
  };
}

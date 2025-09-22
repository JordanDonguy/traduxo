"use client";

import { useState, useEffect } from "react";
import { useAuth, AuthContextType } from "@traduxo/packages/contexts/AuthContext";
import { toast } from "react-toastify";
import { useTranslationContext } from "@traduxo/packages/contexts/TranslationContext";
import { fetchHistory } from "@traduxo/packages/utils/history/fetchHistory";
import { useSelectTranslation } from "../translation/useSelectTranslation";
import { Translation } from "@traduxo/packages/types/translation";
import { API_BASE_URL } from "@traduxo/packages/utils/config/apiBase";

// Injected dependencies for testing
type UseTranslationHistoryArgs = {
  fetcher?: typeof fetch;
  toaster?: typeof toast;
  selectTranslationHook?: ReturnType<typeof useSelectTranslation>;
};

export function useTranslationHistory({
  fetcher = fetch,
  toaster = toast,
  selectTranslationHook,
}: UseTranslationHistoryArgs) {
  // ---- Step 1: Grab context/state ----
  const { translationHistory, setTranslationHistory } = useTranslationContext();
  const [isLoading, setIsLoading] = useState(true);

  // --- Always call hooks unconditionally ---
  const defaultSelectTranslationHook = useSelectTranslation();
  const { status, token } = useAuth();

  // --- Use injected values for testing if provided ---
  const { selectTranslation } = selectTranslationHook ?? defaultSelectTranslationHook;

  // ---- Step 2: Delete handler ----
  async function deleteTranslation(id: string) {
    try {
      if (!token) return false;

      const res = await fetcher(`${API_BASE_URL}/history`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
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

"use client"

import { useSession } from "next-auth/react";
import { useLanguageContext } from "@/context/LanguageContext";

// Injected dependencies for testing
type UseExplanationLanguageArgs = {
  fetcher?: typeof fetch;
  session?: ReturnType<typeof useSession>;
};

// Custom hook for handling explanation language changes.
export function useExplanationLanguage({
  fetcher = fetch,
  session,
}: UseExplanationLanguageArgs = {}) {
  const { systemLang, setSystemLang } = useLanguageContext();
  // --- Always call hooks unconditionally ---
  const defaultSession = useSession();

  // --- Use injected values for testing if provided ---
  const effectiveSession = session ?? defaultSession;
  const { status } = effectiveSession;

  // Change the explanation/system language.
  // Updates local state immediately, and syncs with DB if user is logged in.
  async function changeSystemLang(code: string) {
    // ---- Step 1: Update local state so UI updates immediately ----
    setSystemLang(code);

    // ---- Step 2: If user is logged in, persist new language to DB ----
    if (status === "authenticated") {
      try {
        await fetcher("/api/auth/update-language", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code }),
        });
      } catch (error) {
        console.error(error)
        return false;
      }
    }
    return true;
  }

  return { systemLang, changeSystemLang };
}

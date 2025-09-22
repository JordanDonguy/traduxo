import { useAuth, AuthContextType } from "@traduxo/packages/contexts/AuthContext";
import { useLanguageContext } from "@traduxo/packages/contexts/LanguageContext";
import { API_BASE_URL } from "@traduxo/packages/utils/config/apiBase";

// Injected dependencies for testing
type UseExplanationLanguageArgs = {
  fetcher?: typeof fetch;
  session?: AuthContextType;
};

// Custom hook for handling explanation language changes.
export function useExplanationLanguage({
  fetcher = fetch,
  session,
}: UseExplanationLanguageArgs) {
  const { systemLang, setSystemLang } = useLanguageContext();
  // --- Get session status and token ---
  const { status, token } = useAuth();

  // Change the explanation/system language.
  // Updates local state immediately, and syncs with DB if user is logged in.
  async function changeSystemLang(code: string) {
    // ---- Step 1: Update local state so UI updates immediately ----
    setSystemLang(code);

    // ---- Step 2: If user is logged in, persist new language to DB ----
    if (status === "authenticated") {
      if (!token) return false
      try {
        await fetcher(`${API_BASE_URL}/auth/update-language`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
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

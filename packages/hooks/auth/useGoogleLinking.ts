// hooks/useGoogleLinking.ts
import { useState } from "react";
import { saveToken } from "@traduxo/packages/utils/auth/token";
import { API_BASE_URL } from "@traduxo/packages/utils/config/apiBase";

interface UseGoogleLinkingResult {
  isLoading: boolean;
  error: string;
  handleSubmit: (email: string, password: string) => Promise<void>;
}

interface Dependencies {
  fetchFn?: typeof fetch;
  navigateFn?: (url: string) => void;
}

export function useGoogleLinking({
  fetchFn = fetch,
  navigateFn,
}: Dependencies): UseGoogleLinkingResult {
  if (!navigateFn) throw new Error("Missing navigation dependencies");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (email: string, password: string) => {
    setError("");
    setIsLoading(true);

    if (!email || !password) {
      setError("Please enter both email and password.");
      setIsLoading(false);
      return;
    }

    try {
      const isNative = process.env.PLATFORM === "native";
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (isNative) headers["x-client"] = "native";

      const res = await fetchFn(`${API_BASE_URL}/auth/google-linking`, {
        method: "POST",
        headers,
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.token) {
        setError(data.error || "Something went wrong... Please try again later");
        setIsLoading(false);
        return;
      }

      saveToken(data.token, data.refreshToken ?? undefined);
      navigateFn("/?login=true");
      setIsLoading(false);
    } catch (err) {
      console.error(err);
      setError("Something went wrong... Please try again later");
      setIsLoading(false);
    }
  };

  return { isLoading, error, handleSubmit };
}

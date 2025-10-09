import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { saveToken } from "@traduxo/packages/utils/auth/token";
import { API_BASE_URL } from "@traduxo/packages/utils/config/apiBase";

interface GoogleCallbackOptions {
  fetchFn?: typeof fetch;
}

export function useGoogleCallback({ fetchFn = fetch }: GoogleCallbackOptions) {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const code = params.get("code");
    if (!code) return;

    (async () => {
      try {
        const isNative = process.env.PLATFORM === "native";
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (isNative) headers["x-client"] = "native";

        const res = await fetchFn(`${API_BASE_URL}/auth/google-login`, {
          method: "POST",
          headers,
          body: JSON.stringify({ code }),
        });

        const data = await res.json();

        if (data.error === "NeedGoogleLinking") {
          router.replace("/auth/google/link-account");
          return;
        }

        if (data.token) {
          saveToken(data.token, data.refreshToken ?? undefined);
          router.replace("/?login=true");
        } else {
          router.push("/?error=google-auth");
        }
      } catch (err) {
        router.push("/?error=server");
      }
    })();
  }, [params, router, fetchFn]);
}

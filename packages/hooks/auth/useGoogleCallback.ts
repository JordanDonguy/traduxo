import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { saveToken } from "@traduxo/packages/utils/auth";

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
        const res = await fetchFn("/api/auth/google-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });

        const data = await res.json();

        if (data.error === "NeedGoogleLinking") {
          router.replace("/auth/google/link-account");
          return;
        }

        if (data.accessToken && data.refreshToken) {
          saveToken(data.accessToken, data.refreshToken);
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

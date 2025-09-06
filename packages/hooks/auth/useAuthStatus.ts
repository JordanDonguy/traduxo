import { useState, useEffect } from "react";
import { getToken } from "@packages/utils/auth/getToken";

export type AuthStatus = {
  status: "authenticated" | "unauthenticated" | "loading";
  token?: string;
};

export function useAuthStatus() {
  const [auth, setAuth] = useState<AuthStatus>({ status: "loading" });

  useEffect(() => {
    // Prevent state update if component unmounts before async effect resolves
    let cancelled = false;

    async function init() {
      // ------ Web nextjs auth ------
      if (process.env.PLATFORM === "web") {
        // Next.js branch
        const { useSession } = await import("next-auth/react");
        const { status } = useSession();
        if (!cancelled) setAuth({ status, token: undefined });

        // ------ Native jwt auth ------
      } else if (process.env.PLATFORM === "react-native") {
        // React Native branch: use getToken util
        const token = await getToken();
        if (!cancelled) {
          setAuth({
            status: token ? "authenticated" : "unauthenticated",
            token: token ?? undefined,
          });
        }

        // ------ Unauthenticated ------
      } else {
        /* istanbul ignore else */
        if (!cancelled) setAuth({ status: "unauthenticated", token: undefined });
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, []);

  return auth;
}

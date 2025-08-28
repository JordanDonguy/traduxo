"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { toast } from "react-toastify";

// Injected dependencies for testing
type UseDeleteAccountArgs = {
  fetcher?: typeof fetch;
  toaster?: typeof toast;
  router?: ReturnType<typeof useRouter>;
  signOutFn?: typeof signOut;
};

export function useDeleteAccount({
  fetcher = fetch,
  toaster = toast,
  router,
  signOutFn = signOut,
}: UseDeleteAccountArgs = {}) {
  // --- Always call hooks unconditionally ---
  const defaultRouter = useRouter();

  // --- Use injected values for testing if provided ---
  const effectiveRouter = router ?? defaultRouter;

  const [isLoading, setIsLoading] = useState(false);

  const deleteAccount = async () => {
    // ---- Step 1: Set loading state to trigger spinner ----
    setIsLoading(true);

    // ---- Step 2: Call API to delete the account ----
    try {
      const res = await fetcher("/api/auth/delete-account", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      // ---- Step 3: Handle error response ----
      if (!res.ok) {
        toaster.error("Failed to delete account");
        setIsLoading(false);
        effectiveRouter.push("/");
        return;
      }

      // ---- Step 4: Sign out user after account deletion ----
      await signOutFn({ callbackUrl: "/?delete=true" });

      // ---- Step 5: Reset loading state & redirect ----
      setIsLoading(false);
      effectiveRouter.push("/");
      return true;
    } catch {
      toaster.error("Failed to delete account");
      setIsLoading(false);
      effectiveRouter.push("/");
    }
  };

  return { deleteAccount, isLoading };
}

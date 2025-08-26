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
  router = useRouter(),
  signOutFn = signOut,
}: UseDeleteAccountArgs = {}) {
  const [isLoading, setIsLoading] = useState(false);

  const deleteAccount = async () => {
    // ---- Step 1: Set loading state to trigger spinner ----
    setIsLoading(true);

    // ---- Step 2: Call API to delete the account ----
    const res = await fetcher("/api/auth/delete-account", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();

    // ---- Step 3: Handle error response ----
    if (!res.ok) {
      toaster.error(data.message || "Failed to delete account");
      setIsLoading(false);
      router.push("/");
      return;
    }

    // ---- Step 4: Sign out user after account deletion ----
    await signOutFn({ callbackUrl: "/?delete=true" });

    // ---- Step 5: Reset loading state & redirect ----
    setIsLoading(false);
    router.push("/");
    return true;
  };

  return { deleteAccount, isLoading };
}

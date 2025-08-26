"use client"

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

type UseChangePasswordArgs = {
  isCredentials?: boolean;
  // Injected dependencies for testing
  fetcher?: typeof fetch;
  toaster?: typeof toast;
  router?: ReturnType<typeof useRouter>;
  sessionUpdater?: ReturnType<typeof useSession>["update"];
};

export function useChangePassword({
  isCredentials,
  fetcher = fetch,
  toaster = toast,
  router,
  sessionUpdater,
}: UseChangePasswordArgs) {

  // --- Always call hooks unconditionally ---
  const defaultRouter = useRouter();
  const { update } = useSession();

  // --- Use injected values for testing if provided ---
  const effectiveRouter = router ?? defaultRouter;
  const effectiveUpdater = sessionUpdater ?? update;

  // State to track loading spinner
  const [isLoading, setIsLoading] = useState(false);

  // State to store and display error messages
  const [error, setError] = useState("");

  // -------------- Handle submit (update/create password) --------------
  const handleSubmit = async ({
    currentPassword,
    password,
    confirmPassword,
  }: {
    currentPassword?: string;
    password: string;
    confirmPassword: string;
  }) => {
    // ---- Step 1: Basic validations ----
    if (password.length < 8 || confirmPassword.length < 8) {
      setError("Passwords length must be at least 8 characters");
      return false;
    }
    if (password !== confirmPassword) {
      setError("New password and confirm password don't match");
      return false;
    }

    // ---- Step 2: Start loading state ----
    setIsLoading(true);

    try {
      // ---- Step 3: Pick correct API route depending on account type ----
      const url = isCredentials
        ? "/api/auth/update-password"
        : "/api/auth/create-password";

      // ---- Step 4: Build request body ----
      const body = isCredentials
        ? { currentPassword, password }
        : { password };

      // ---- Step 5: Send request to backend ----
      const res = await fetcher(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      // ---- Step 6: If error, show it and stop ----
      if (!res.ok) {
        setError(
          data?.error ||
          `Error while ${isCredentials ? "updating" : "creating"} your password`
        );
        return false;
      }

      // ---- Step 7: If success, reset form + show toast ----
      toaster.success(
        `Your password has been ${isCredentials ? "updated" : "created"}`
      );

      // ---- Step 8: Redirect user back to home ----
      effectiveRouter.push("/");

      // ---- Step 9: Refresh session in NextAuth ----
      await effectiveUpdater();

      return true;
    } catch {
      // ---- Step 10: Catch any unexpected error ----
      setError("Internal server error");
      return false;
    } finally {
      // ---- Step 11: Always stop loading spinner ----
      setIsLoading(false);
    }
  };

  return { isLoading, error, handleSubmit };
}

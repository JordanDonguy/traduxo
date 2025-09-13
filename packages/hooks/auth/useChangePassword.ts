import { useState } from "react";
import { useAuth, AuthContextType } from "@traduxo/packages/contexts/AuthContext";

type UseChangePasswordArgs = {
  isCredentials?: boolean;
  fetcher?: typeof fetch;
  sessionUpdater?: AuthContextType["refresh"];
  // let the component handle side effects
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
};

export function useChangePassword({
  isCredentials,
  fetcher = fetch,
  sessionUpdater,
  onSuccess,
  onError,
}: UseChangePasswordArgs) {
  const { refresh } = useAuth();
  const effectiveUpdater = sessionUpdater ?? refresh;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async ({
    currentPassword,
    password,
    confirmPassword,
  }: {
    currentPassword?: string;
    password: string;
    confirmPassword: string;
  }) => {
    if (password.length < 8 || confirmPassword.length < 8) {
      const msg = "Passwords must be at least 8 characters";
      setError(msg);
      onError?.(msg);
      return false;
    }
    if (password !== confirmPassword) {
      const msg = "New password and confirm password don't match";
      setError(msg);
      onError?.(msg);
      return false;
    }

    setIsLoading(true);

    try {
      const url = isCredentials
        ? "/api/auth/update-password"
        : "/api/auth/create-password";

      const body = isCredentials
        ? { currentPassword, password }
        : { password };

      const res = await fetcher(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg =
          data?.error ||
          `Error while ${isCredentials ? "updating" : "creating"} your password`;
        setError(msg);
        onError?.(msg);
        return false;
      }

      const msg = `Your password has been ${isCredentials ? "updated" : "created"}`;
      onSuccess?.(msg);

      await effectiveUpdater();

      return true;
    } catch {
      const msg = "Internal server error";
      setError(msg);
      onError?.(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, error, handleSubmit };
}

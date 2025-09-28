"use client";

import { useState } from "react";
import { getToken } from "@traduxo/packages/utils/auth/token";
import { logoutUser } from "@traduxo/packages/utils/auth/logout";
import { API_BASE_URL } from "@traduxo/packages/utils/config/apiBase";
import { clearToken } from "@traduxo/packages/utils/auth/token";

type UseDeleteAccountArgs = {
  fetcher?: typeof fetch;
  logoutFn?: typeof logoutUser;
  onSuccess?: () => void;
  onError?: (message: string) => void;
};

export function useDeleteAccount({
  fetcher = fetch,
  logoutFn = logoutUser,
  onSuccess,
  onError,
}: UseDeleteAccountArgs) {
  const [isLoading, setIsLoading] = useState(false);

  const deleteAccount = async () => {
    setIsLoading(true);

    try {
      // Step 1: Get tokens
      const tokens = await getToken(true);

      if (!tokens?.token || !tokens?.refreshToken) {
        onError?.("Missing authentication tokens");
        return false
      }

      // Step 2: Delete account
      const res = await fetcher(`${API_BASE_URL}/auth/delete-account`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${tokens.token}`
        },
      });

      if (!res.ok) {
        onError?.("Failed to delete account");
        return false;
      }

      // Step 3: Logout
      const success = await logoutFn(tokens.token, tokens.refreshToken);
      if (!success) {
        onError?.("Account deleted but failed to logout, please logout manually.");
        return false
      }

      // Remove tokens from storage
      await clearToken();

      // Step 4: Success callback (redirect, toast, etc.)
      onSuccess?.();
      return true;
    } catch {
      onError?.("Failed to delete account");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { deleteAccount, isLoading };
}

import { API_BASE_URL } from "@traduxo/packages/utils/config/apiBase";
import * as SecureStore from "expo-secure-store";

let refreshing = false;

export async function refreshToken(oldRefreshToken: string): Promise<string | null> {
  if (refreshing) return null;
  refreshing = true;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/jwt-refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-client": "native" },
      body: JSON.stringify({ refreshToken: oldRefreshToken }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const { accessToken, refreshToken: newRefreshToken } = data;

    if (!accessToken || !newRefreshToken) return null;

    // Save new refresh token in SecureStore
    await SecureStore.setItemAsync("refreshToken", newRefreshToken);

    return accessToken;
  } catch (err) {
    console.error("refreshToken error:", err);
    return null;
  } finally {
    refreshing = false;
  }
}

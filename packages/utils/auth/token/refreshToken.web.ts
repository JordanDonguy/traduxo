import { API_BASE_URL } from "@traduxo/packages/utils/config/apiBase";

let refreshing = false;

export async function refreshToken(oldAccessToken?: string): Promise<string | null> {
  if (refreshing) return null; // prevent concurrent calls
  refreshing = true;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/jwt-refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!res.ok) {
      console.warn("Refresh request failed:", res.status);
      return null;
    }

    const data = await res.json();
    const { accessToken } = data;

    if (!accessToken) return null;

    return accessToken;
  } catch (err) {
    console.error("refreshToken error:", err);
    return null;
  } finally {
    refreshing = false;
  }
}

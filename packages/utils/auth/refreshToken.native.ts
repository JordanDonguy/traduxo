import { API_BASE_URL } from "../config/apiBase";

let refreshing: boolean = false;

export async function refreshToken(oldRefreshToken: string, oldAccessToken: string): Promise<string | null> {
  if (refreshing) return null; // prevent double call
  refreshing = true;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/jwt-refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: oldRefreshToken, accessToken: oldAccessToken }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const { accessToken, refreshToken: newRefreshToken } = data;

    if (!accessToken || !newRefreshToken) return null;

    const { default: AsyncStorage } = await import("@react-native-async-storage/async-storage");
    await AsyncStorage.setItem("refreshToken", newRefreshToken);

    return accessToken;
  } catch (err) {
    console.error("refreshToken error: ", err)
    return null;
  } finally {
    refreshing = false;
  }
}

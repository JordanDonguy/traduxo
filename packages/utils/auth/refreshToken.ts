export async function refreshToken(oldRefreshToken: string): Promise<string | null> {
  try {
    const res = await fetch(`${process.env.API_BASE_URL}/jwt-refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: oldRefreshToken }),
    });

    if (!res.ok) return null;

    const data = await res.json();

    const { accessToken, refreshToken: newRefreshToken } = data;

    if (!accessToken || !newRefreshToken) return null;

    const { default: AsyncStorage } = await import("@react-native-async-storage/async-storage");
    await AsyncStorage.setItem("accessToken", accessToken);
    await AsyncStorage.setItem("refreshToken", newRefreshToken);

    return accessToken;
  } catch {
    return null;
  }
}

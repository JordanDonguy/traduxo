import { jwtDecode } from "jwt-decode";
import { refreshToken } from "@traduxo/packages/utils/auth/token/refreshToken.native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { TokenResult } from "@traduxo/packages/types/token";
import { JwtPayload } from "@traduxo/packages/types/jwt";

/**
 * Retrieves the access token from AsyncStorage.
 * Automatically refreshes if expired and refresh token is available.
 *
 * @param returnRefreshToken - Whether to include the refresh token in the result
 * @returns TokenResult or null if unavailable/invalid
 */
export async function getToken(returnRefreshToken = false): Promise<TokenResult | null> {
  const now = Math.floor(Date.now() / 1000);

  // Get stored access token and optionally the refresh token
  let token = await AsyncStorage.getItem("accessToken");
  const refreshTokenFromStorage = returnRefreshToken
    ? await AsyncStorage.getItem("refreshToken")
    : undefined;

  if (!token) return null;

  let payload: JwtPayload | null = null;

  // Try decoding the current token
  try {
    payload = jwtDecode<JwtPayload>(token);
  } catch {
    // Token malformed, attempt refresh if refresh token exists
    if (refreshTokenFromStorage) {
      const newToken = await refreshToken(refreshTokenFromStorage, token);
      if (!newToken) return null;

      token = newToken;
      await AsyncStorage.setItem("accessToken", newToken);

      try {
        payload = jwtDecode<JwtPayload>(newToken);
      } catch {
        return null;
      }
    } else {
      return null; // no refresh token available
    }
  }

  // If token is expired, refresh it
  if (payload.exp && payload.exp < now) {
    if (!refreshTokenFromStorage) return null;

    const newToken = await refreshToken(refreshTokenFromStorage, token);
    if (!newToken) return null;

    token = newToken;
    await AsyncStorage.setItem("accessToken", newToken);

    try {
      payload = jwtDecode<JwtPayload>(newToken);
    } catch {
      return null;
    }
  }

  // Return token result
  const result: TokenResult = {
    token,
    language: payload.language,
    providers: payload.providers,
  };

  if (returnRefreshToken && refreshTokenFromStorage) {
    result.refreshToken = refreshTokenFromStorage;
  }

  return result;
}

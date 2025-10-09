import { jwtDecode } from "jwt-decode";
import { refreshToken } from "./refreshToken.native";
import * as SecureStore from "expo-secure-store";
import { TokenResult } from "@traduxo/packages/types/token";
import { JwtPayload } from "@traduxo/packages/types/jwt";
import { getAccessToken, setAccessToken } from "./tokenStore";

export async function getToken(): Promise<TokenResult | null> {
  const now = Math.floor(Date.now() / 1000);

  // 1. Try in-memory token first
  let token = getAccessToken();

  // 2. Fallback to SecureStore
  if (!token) {
    token = await SecureStore.getItemAsync("accessToken");
    if (token) setAccessToken(token);
  }

  // 3. Get refresh token from SecureStore
  const storedRefreshToken = await SecureStore.getItemAsync("refreshToken");

  // If no token and no refresh token, user is unauthenticated
  if (!token && !storedRefreshToken) return null;

  let payload: JwtPayload | null = null;

  // 4. Decode token if available
  if (token) {
    try {
      payload = jwtDecode<JwtPayload>(token);
    } catch {
      token = null;
      payload = null;
    }
  }

  // 5. Refresh if missing or expired
  if (!token || (payload?.exp && payload.exp < now)) {
    if (!storedRefreshToken) return null;

    const newToken = await refreshToken(storedRefreshToken);
    if (!newToken) return null;

    token = newToken;
    setAccessToken(token);
    await SecureStore.setItemAsync("accessToken", token);

    try {
      payload = jwtDecode<JwtPayload>(token);
    } catch {
      return null;
    }
  }

  if (!token || !payload) return null;

  // 6. Return token result
  const result: TokenResult = {
    token,
    refreshToken: storedRefreshToken,
    language: payload.language,
    providers: payload.providers,
  };

  return result;
}

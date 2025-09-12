import { jwtDecode } from "jwt-decode";
import { refreshToken } from "@traduxo/packages/utils/auth/token/refreshToken.native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { TokenResult } from "@traduxo/packages/types/token";
import { JwtPayload } from "@traduxo/packages/types/jwt";

export async function getToken(returnRefreshToken = false): Promise<TokenResult | null> {
  const now = Math.floor(Date.now() / 1000);

  let token = await AsyncStorage.getItem("accessToken");
  const refresh = returnRefreshToken ? await AsyncStorage.getItem("refreshToken") : undefined;

  if (!token) return null;

  let payload: JwtPayload;
  try {
    payload = jwtDecode(token) as JwtPayload;
  } catch {
    return null;
  }

  // Refresh logic
  if (payload.exp && payload.exp < now) {
    if (!refresh) return null;

    const newToken = await refreshToken(refresh, token);
    if (!newToken) return null;

    token = newToken;
    await AsyncStorage.setItem("accessToken", newToken);

    try {
      payload = jwtDecode(newToken) as JwtPayload;
    } catch {
      return null;
    }
  }

  const result: TokenResult = { token, language: payload.language, providers: payload.providers };
  if (returnRefreshToken && refresh) result.refreshToken = refresh;

  return result;
}

import { jwtDecode } from "jwt-decode";
import { refreshToken } from "@packages/utils/auth/refreshToken.native";

export type JwtPayload = {
  exp?: number;
  language?: string;
  providers?: string[];
};

import AsyncStorage from "@react-native-async-storage/async-storage";

export async function getToken(): Promise<{ token: string; language?: string; providers?: string[] } | null> {
  const now = Math.floor(Date.now() / 1000);

  const token = await AsyncStorage.getItem("accessToken");
  if (!token) return null;

  let payload: JwtPayload;
  try {
    payload = jwtDecode(token) as JwtPayload;
  } catch {
    return null;
  }

  // Refresh logic
  if (payload.exp && payload.exp < now) {
    const refresh = await AsyncStorage.getItem("refreshToken");
    if (!refresh) return null;

    const newToken = await refreshToken(refresh, token);
    if (!newToken) return null;

    await AsyncStorage.setItem("accessToken", newToken);

    try {
      payload = jwtDecode(newToken) as JwtPayload;
    } catch {
      return null;
    }

    return { token: newToken, language: payload.language, providers: payload.providers };
  }

  return { token, language: payload.language, providers: payload.providers };
}

import { jwtDecode } from "jwt-decode";
import { refreshToken } from "./refreshToken.web";

export type JwtPayload = {
  exp?: number;
  language?: string;
  providers?: string[];
};

export async function getToken(): Promise<{ token: string; language?: string; providers?: string[] } | null> {
  const now = Math.floor(Date.now() / 1000);

  const token = localStorage.getItem("accessToken");
  if (!token) return null;

  let payload: JwtPayload;
  try {
    payload = (jwtDecode as unknown as (token: string) => JwtPayload)(token);
  } catch {
    return null;
  }

  // Refresh logic
  if (payload.exp && payload.exp < now) {
    const refresh = localStorage.getItem("refreshToken");
    if (!refresh) return null;

    const newToken = await refreshToken(refresh, token);
    if (!newToken) return null;

    localStorage.setItem("accessToken", newToken);

    try {
      payload = (jwtDecode as unknown as (token: string) => JwtPayload)(newToken);
    } catch {
      return null;
    }

    return { token: newToken, language: payload.language, providers: payload.providers };
  }

  return { token, language: payload.language, providers: payload.providers };
}

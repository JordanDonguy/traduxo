import { jwtDecode } from "jwt-decode";
import { refreshToken } from "./refreshToken.web";
import { TokenResult } from "@traduxo/packages/types/token";
import { JwtPayload } from "@traduxo/packages/types/jwt";

export async function getToken(returnRefreshToken = false): Promise<TokenResult | null> {
  const now = Math.floor(Date.now() / 1000);

  let token = localStorage.getItem("accessToken");
  const refreshTokenFromStorage = localStorage.getItem("refreshToken");

  if (!token) return null;

  let payload: JwtPayload;
  try {
    payload = (jwtDecode as unknown as (token: string) => JwtPayload)(token);
  } catch {
    return null;
  }

  // Refresh logic
  if (payload.exp && payload.exp < now) {
    if (!refreshTokenFromStorage) return null;

    const newToken = await refreshToken(refreshTokenFromStorage, token);
    if (!newToken) return null;

    token = newToken;
    localStorage.setItem("accessToken", newToken);

    try {
      payload = (jwtDecode as unknown as (token: string) => JwtPayload)(newToken);
    } catch {
      return null;
    }
  }

  const result: TokenResult = { token, language: payload.language, providers: payload.providers };
  if (returnRefreshToken && refreshTokenFromStorage) result.refreshToken = refreshTokenFromStorage;

  return result;
}


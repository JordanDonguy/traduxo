import { jwtDecode } from "jwt-decode";
import { refreshToken } from "./refreshToken.web";
import { TokenResult } from "@traduxo/packages/types/token";
import { JwtPayload } from "@traduxo/packages/types/jwt";

export async function getToken(returnRefreshToken = false): Promise<TokenResult | null> {
  const now = Math.floor(Date.now() / 1000);

  // Load tokens from storage
  let token = localStorage.getItem("accessToken");
  const refreshTokenFromStorage = localStorage.getItem("refreshToken");

  // If we don't even have an access token, user is unauthenticated
  if (!token) return null;

  let payload: JwtPayload | null = null;

  try {
    // Try to decode the access token
    payload = jwtDecode<JwtPayload>(token);
  } catch {
    // If decoding fails, try refreshing with the refresh token
    if (refreshTokenFromStorage) {
      const newToken = await refreshToken(refreshTokenFromStorage, token);
      if (!newToken) return null; // refresh failed → unauthenticated

      // Store and decode the new access token
      token = newToken;
      localStorage.setItem("accessToken", newToken);

      try {
        payload = jwtDecode<JwtPayload>(newToken);
      } catch {
        return null; // even refreshed token is invalid
      }
    } else {
      return null; // no refresh token available → unauthenticated
    }
  }

  // If the token is expired, try refreshing
  if (payload.exp && payload.exp < now) {
    if (!refreshTokenFromStorage) return null;

    const newToken = await refreshToken(refreshTokenFromStorage, token);
    if (!newToken) return null;

    token = newToken;
    localStorage.setItem("accessToken", newToken);

    try {
      payload = jwtDecode<JwtPayload>(newToken);
    } catch {
      return null; // refreshed token couldn't be decoded → unauthenticated
    }
  }

  // Build the final result object with data from the token payload
  const result: TokenResult = {
    token,
    language: payload.language,
    providers: payload.providers,
  };

  // Optionally include the refresh token if requested
  if (returnRefreshToken && refreshTokenFromStorage) {
    result.refreshToken = refreshTokenFromStorage;
  }

  return result;
}

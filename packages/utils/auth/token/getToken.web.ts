import { jwtDecode } from "jwt-decode";
import { TokenResult } from "@traduxo/packages/types/token";
import { JwtPayload } from "@traduxo/packages/types/jwt";
import { getAccessToken, setAccessToken } from "./tokenStore";
import { refreshToken } from "./refreshToken.web";

export async function getToken(): Promise<TokenResult | null> {
  const now = Math.floor(Date.now() / 1000);

  // First, check shared in-memory token
  let token = getAccessToken();
  let payload: JwtPayload | null = null;

  // Try decoding current token if it exists
  if (token) {
    try {
      payload = jwtDecode<JwtPayload>(token);
    } catch {
      token = null;
    }
  }

  // If no token or expired, attempt refresh
  if (!token || (payload?.exp && payload.exp < now)) {
    const refreshed = await refreshToken(token ?? undefined);
    if (!refreshed) return null;

    token = refreshed;
    setAccessToken(token);

    try {
      payload = jwtDecode<JwtPayload>(token);
    } catch {
      console.error("Could not decode refreshed token");
      return null;
    }
  }

  if (!token || !payload) return null;

  return {
    token,
    language: payload.language,
    providers: payload.providers,
  };
}

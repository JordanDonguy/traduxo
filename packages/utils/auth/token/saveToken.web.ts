import { setAccessToken } from "./tokenStore";

export async function saveToken(accessToken?: string, _refreshToken?: string) {
  if (accessToken) setAccessToken(accessToken);
  // refresh token is ignored on web
}

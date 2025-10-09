import { clearAccessToken } from "./tokenStore";

export async function clearToken() {
  // Clear only the in-memory token
  clearAccessToken();
}

import * as SecureStore from "expo-secure-store";
import { clearAccessToken } from "./tokenStore";

export async function clearToken() {
  // Clear in-memory token
  clearAccessToken();

  // Clear tokens from secure storage
  await SecureStore.deleteItemAsync("accessToken");
  await SecureStore.deleteItemAsync("refreshToken");
}

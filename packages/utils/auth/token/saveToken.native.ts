import * as SecureStore from "expo-secure-store";
import { setAccessToken } from "./tokenStore";

export async function saveToken(accessToken?: string, refreshToken?: string) {
  if (accessToken) setAccessToken(accessToken);
  if (accessToken) await SecureStore.setItemAsync("accessToken", accessToken);
  if (refreshToken) await SecureStore.setItemAsync("refreshToken", refreshToken);
}

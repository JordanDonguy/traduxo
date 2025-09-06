import { refreshToken } from "./refreshToken";

type JwtPayload = {
  exp?: number;
};

export async function getToken(): Promise<string | null> {
  const { default: AsyncStorage } = await import("@react-native-async-storage/async-storage");

  // Dynamically import jwt-decode for proper typing
  const jwtDecodeModule = await import("jwt-decode");
  const jwt_decode = (jwtDecodeModule.default as unknown) as (token: string) => JwtPayload;

  let token = await AsyncStorage.getItem("accessToken");
  if (!token) return null;

  try {
    const payload: JwtPayload = jwt_decode(token);
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      // token expired → try refresh
      const refresh = await AsyncStorage.getItem("refreshToken");
      if (!refresh) return null;

      const newToken = await refreshToken(refresh);
      if (!newToken) return null;

      return newToken;
    }

    return token; // valid
  } catch {
    return null; // malformed token
  }
}

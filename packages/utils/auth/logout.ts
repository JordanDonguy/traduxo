import { API_BASE_URL } from "../config/apiBase";

export const logoutUser = async (accessToken: string, refreshToken?: string) => {
  const res = await fetch(`${API_BASE_URL}/auth/jwt-logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accessToken, refreshToken }),
  });
  return res.ok;
};

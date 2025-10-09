import { API_BASE_URL } from "../config/apiBase";

export const loginUser = async (
  email: string,
  password: string,
) => {
  const isNative = process.env.PLATFORM === "native";
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (isNative) headers["x-client"] = "native";

  const res = await fetch(`${API_BASE_URL}/auth/jwt-login`, {
    method: "POST",
    headers,
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  return { res, data };
};

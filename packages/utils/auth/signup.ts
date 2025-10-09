import { API_BASE_URL } from "@traduxo/packages/utils/config/apiBase";

export const signupUser = async (
  email: string,
  password: string,
) => {
  const isNative = process.env.PLATFORM === "native";
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (isNative) headers["x-client"] = "native";

  const res = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: "POST",
    headers,
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  return { res, data };
};

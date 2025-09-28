import { API_BASE_URL } from "../config/apiBase";

export const signupUser = async (email: string, password: string) => {
  const res = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  return { res, data };
};

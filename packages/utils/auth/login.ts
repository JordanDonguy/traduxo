import { AppProviderBase } from "@traduxo/packages/contexts/AppContext";
import { API_BASE_URL } from "../config/apiBase";

export const loginUser = async (email: string, password: string) => {
  const res = await fetch(`${API_BASE_URL}/auth/jwt-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  return { res, data };
};

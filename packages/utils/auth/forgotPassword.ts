import { API_BASE_URL } from "../config/apiBase";

export const forgotPasswordRequest = async (email: string) => {
  const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  return { res, data };
};

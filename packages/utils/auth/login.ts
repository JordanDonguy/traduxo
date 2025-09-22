export const loginUser = async (email: string, password: string) => {
  const res = await fetch("/api/auth/jwt-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  return { res, data };
};

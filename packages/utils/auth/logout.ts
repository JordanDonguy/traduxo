export const logoutUser = async (accessToken: string, refreshToken: string) => {
  const res = await fetch("/api/auth/jwt-logout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accessToken, refreshToken }),
  });
  return res.ok;
};

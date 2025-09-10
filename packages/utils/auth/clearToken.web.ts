export async function clearToken() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
}

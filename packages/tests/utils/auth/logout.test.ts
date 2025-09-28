import { logoutUser } from "@traduxo/packages/utils/auth/logout";

describe("logoutUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls fetch with correct URL and payload", async () => {
    const mockFetch = jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
    } as any);

    const accessToken = "access";
    const refreshToken = "refresh";

    const result = await logoutUser(accessToken, refreshToken);

    expect(mockFetch).toHaveBeenCalledWith("/auth/jwt-logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken, refreshToken }),
    });
    expect(result).toBe(true);

    mockFetch.mockRestore();
  });

  it("returns false when response is not ok", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
    } as any);

    const result = await logoutUser("access", "refresh");
    expect(result).toBe(false);
  });

  it("throws if fetch rejects", async () => {
    jest.spyOn(global, "fetch").mockRejectedValue(new Error("Network down"));

    await expect(logoutUser("access", "refresh")).rejects.toThrow("Network down");
  });
});

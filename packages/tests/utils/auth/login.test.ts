import { loginUser } from "@traduxo/packages/utils/auth/login";

describe("loginUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls fetch with correct URL and payload", async () => {
    const mockJson = jest.fn().mockResolvedValue({ accessToken: "a", refreshToken: "b" });
    const mockFetch = jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: mockJson,
    } as any);

    const email = "test@test.com";
    const password = "password123";

    const result = await loginUser(email, password);

    expect(mockFetch).toHaveBeenCalledWith("/api/auth/jwt-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    expect(result.data).toEqual({ accessToken: "a", refreshToken: "b" });
    expect(result.res.ok).toBe(true);

    mockFetch.mockRestore();
  });

  it("handles API error responses", async () => {
    const mockJson = jest.fn().mockResolvedValue({ error: "Invalid credentials" });
    jest.spyOn(global, "fetch").mockResolvedValue({ ok: false, json: mockJson } as any);

    const result = await loginUser("bad@test.com", "wrongpass");

    expect(result.data).toEqual({ error: "Invalid credentials" });
    expect(result.res.ok).toBe(false);
  });

  it("throws if fetch rejects", async () => {
    jest.spyOn(global, "fetch").mockRejectedValue(new Error("Network down"));

    await expect(loginUser("test@test.com", "password")).rejects.toThrow("Network down");
  });
});

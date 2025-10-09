// tests/utils/auth/login.test.ts
import { loginUser } from "@traduxo/packages/utils/auth/login";
import { API_BASE_URL } from "@traduxo/packages/utils/config/apiBase";

describe("loginUser", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ------ Test 1️⃣ ------
  it("calls fetch with correct URL and payload", async () => {
    const mockJson = jest.fn().mockResolvedValue({ accessToken: "a", refreshToken: "b" });
    const mockFetch = jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: mockJson,
    } as any);

    const email = "test@test.com";
    const password = "password123";

    const result = await loginUser(email, password);

    expect(mockFetch).toHaveBeenCalledWith(`${API_BASE_URL}/auth/jwt-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    expect(result.data).toEqual({ accessToken: "a", refreshToken: "b" });
    expect(result.res.ok).toBe(true);
  });

  // ------ Test 2️⃣ ------
  it("handles API error responses", async () => {
    const mockJson = jest.fn().mockResolvedValue({ error: "Invalid credentials" });
    jest.spyOn(global, "fetch").mockResolvedValue({ ok: false, json: mockJson } as any);

    const result = await loginUser("bad@test.com", "wrongpass");

    expect(result.data).toEqual({ error: "Invalid credentials" });
    expect(result.res.ok).toBe(false);
  });

  // ------ Test 3️⃣ ------
  it("adds native header if PLATFORM is 'native'", async () => {
    process.env.PLATFORM = "native";
    const mockJson = jest.fn().mockResolvedValue({ accessToken: "a", refreshToken: "b" });
    const mockFetch = jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: mockJson,
    } as any);

    await loginUser("native@test.com", "pass");

    expect(mockFetch).toHaveBeenCalledWith(`${API_BASE_URL}/auth/jwt-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-client": "native" },
      body: JSON.stringify({ email: "native@test.com", password: "pass" }),
    });

    delete process.env.PLATFORM;
  });

  // ------ Test 4️⃣ ------
  it("throws if fetch rejects", async () => {
    jest.spyOn(global, "fetch").mockRejectedValue(new Error("Network down"));

    await expect(loginUser("test@test.com", "password")).rejects.toThrow("Network down");
  });
});

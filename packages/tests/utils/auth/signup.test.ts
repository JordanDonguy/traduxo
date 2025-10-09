// tests/utils/auth/signup.test.ts
import { signupUser } from "@traduxo/packages/utils/auth/signup";
import { API_BASE_URL } from "@traduxo/packages/utils/config/apiBase";

describe("signupUser", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    delete process.env.PLATFORM;
  });

  // ------ Test 1️⃣ ------
  it("calls fetch with correct URL and payload", async () => {
    const mockJson = jest.fn().mockResolvedValue({ id: "123", email: "test@test.com" });
    const mockFetch = jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: mockJson,
    } as any);

    const email = "test@test.com";
    const password = "password123";

    const result = await signupUser(email, password);

    expect(mockFetch).toHaveBeenCalledWith(`${API_BASE_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    expect(result.res.ok).toBe(true);
    expect(result.data).toEqual({ id: "123", email: "test@test.com" });
  });

  // ------ Test 2️⃣ ------
  it("handles API error responses", async () => {
    const mockJson = jest.fn().mockResolvedValue({ error: "Email already exists" });
    jest.spyOn(global, "fetch").mockResolvedValue({ ok: false, json: mockJson } as any);

    const result = await signupUser("test@test.com", "password123");

    expect(result.res.ok).toBe(false);
    expect(result.data).toEqual({ error: "Email already exists" });
  });

  // ------ Test 3️⃣ ------
  it("adds native header if PLATFORM is 'native'", async () => {
    process.env.PLATFORM = "native";

    const mockJson = jest.fn().mockResolvedValue({ id: "123", email: "native@test.com" });
    const mockFetch = jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: mockJson,
    } as any);

    await signupUser("native@test.com", "pass");

    expect(mockFetch).toHaveBeenCalledWith(`${API_BASE_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-client": "native" },
      body: JSON.stringify({ email: "native@test.com", password: "pass" }),
    });
  });

  // ------ Test 4️⃣ ------
  it("throws if fetch rejects", async () => {
    jest.spyOn(global, "fetch").mockRejectedValue(new Error("Network down"));

    await expect(signupUser("test@test.com", "password123")).rejects.toThrow("Network down");
  });
});

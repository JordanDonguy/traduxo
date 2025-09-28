import { signupUser } from "@traduxo/packages/utils/auth/signup";

describe("signupUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls fetch with correct URL and payload", async () => {
    const mockFetch = jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ id: "123", email: "test@test.com" }),
    } as any);

    const email = "test@test.com";
    const password = "password123";

    const result = await signupUser(email, password);

    expect(mockFetch).toHaveBeenCalledWith("/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    expect(result.res.ok).toBe(true);
    expect(result.data).toEqual({ id: "123", email: "test@test.com" });

    mockFetch.mockRestore();
  });

  it("returns response and data even when response not ok", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Email already exists" }),
    } as any);

    const result = await signupUser("test@test.com", "password123");

    expect(result.res.ok).toBe(false);
    expect(result.data).toEqual({ error: "Email already exists" });
  });

  it("throws if fetch rejects", async () => {
    jest.spyOn(global, "fetch").mockRejectedValue(new Error("Network down"));

    await expect(signupUser("test@test.com", "password123")).rejects.toThrow("Network down");
  });
});

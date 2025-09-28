import { forgotPasswordRequest } from "@traduxo/packages/utils/auth/forgotPassword";

describe("forgotPasswordRequest", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls fetch with correct URL and payload", async () => {
    const mockFetch = jest.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ message: "Email sent" }),
    } as any);

    const email = "test@test.com";

    const result = await forgotPasswordRequest(email);

    expect(mockFetch).toHaveBeenCalledWith("/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    expect(result.res.ok).toBe(true);
    expect(result.data).toEqual({ message: "Email sent" });

    mockFetch.mockRestore();
  });

  it("returns response and data even if response not ok", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Invalid email" }),
    } as any);

    const result = await forgotPasswordRequest("invalid@test.com");

    expect(result.res.ok).toBe(false);
    expect(result.data).toEqual({ error: "Invalid email" });
  });

  it("throws if fetch rejects", async () => {
    jest.spyOn(global, "fetch").mockRejectedValue(new Error("Network down"));

    await expect(forgotPasswordRequest("test@test.com")).rejects.toThrow("Network down");
  });
});

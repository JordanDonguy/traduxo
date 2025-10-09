/**
 * @jest-environment jsdom
 */
import { refreshToken } from "@traduxo/packages/utils/auth/token/refreshToken.web";
import { API_BASE_URL } from "@traduxo/packages/utils/config/apiBase";

beforeEach(() => {
  global.fetch = jest.fn();
});

describe("refreshToken.web", () => {
  // ------ Test 1️⃣ ------
  it("returns accessToken if successful", async () => {
    const newAccess = "new.access";

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ token: newAccess }),
    });

    const token = await refreshToken();

    expect(global.fetch).toHaveBeenCalledWith(`${API_BASE_URL}/auth/jwt-refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    expect(token).toBe(newAccess);
  });

  // ------ Test 2️⃣ ------
  it("returns null if response not ok", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false });

    const token = await refreshToken();
    expect(token).toBeNull();
  });

  // ------ Test 3️⃣ ------
  it("returns null if accessToken missing in response", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    const token = await refreshToken();
    expect(token).toBeNull();
  });

  // ------ Test 4️⃣ ------
  it("returns null if fetch throws", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("network error"));

    const token = await refreshToken();
    expect(token).toBeNull();
  });

  // ------ Test 5️⃣ ------
  it("prevents concurrent refresh calls", async () => {
    const newAccess = "new.access";

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ token: newAccess }),
    });

    // Trigger two calls concurrently
    const [first, second] = await Promise.all([refreshToken(), refreshToken()]);

    expect(first).toBe(newAccess);
    expect(second).toBeNull();
  });
});

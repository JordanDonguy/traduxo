/**
 * @jest-environment jsdom
 */
import { refreshToken } from "@traduxo/packages/utils/auth/refreshToken.web";
import { API_BASE_URL } from "@traduxo/packages/utils/config/apiBase";

beforeAll(() => {
  // Polyfill localStorage
  let store: Record<string, string> = {};
  Object.defineProperty(global, "localStorage", {
    value: {
      getItem: jest.fn((key) => store[key] || null),
      setItem: jest.fn((key, value) => { store[key] = value; }),
      removeItem: jest.fn((key) => { delete store[key]; }),
      clear: jest.fn(() => { store = {}; }),
    },
    writable: true,
  });
});

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  global.fetch = jest.fn();
});

describe("refreshToken.web", () => {
  const oldRefresh = "old.refresh";
  const oldAccess = "old.access";

  // ------ Test 1️⃣ ------
  it("returns accessToken and saves new refresh token if successful", async () => {
    const newAccess = "new.access";
    const newRefresh = "new.refresh";

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ accessToken: newAccess, refreshToken: newRefresh }),
    });

    const token = await refreshToken(oldRefresh, oldAccess);

    expect(global.fetch).toHaveBeenCalledWith(`${API_BASE_URL}/auth/jwt-refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: oldRefresh, accessToken: oldAccess }),
    });

    expect(localStorage.getItem("refreshToken")).toBe(newRefresh);
    expect(token).toBe(newAccess);
  });

  // ------ Test 2️⃣ ------
  it("returns null if response not ok", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false });

    const token = await refreshToken(oldRefresh, oldAccess);
    expect(token).toBeNull();
  });

  // ------ Test 3️⃣ ------
  it("returns null if accessToken or refreshToken missing", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ accessToken: null, refreshToken: null }),
    });

    const token = await refreshToken(oldRefresh, oldAccess);
    expect(token).toBeNull();
  });

  // ------ Test 4️⃣ ------
  it("returns null if fetch throws", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("network error"));

    const token = await refreshToken(oldRefresh, oldAccess);
    expect(token).toBeNull();
  });
});

/**
 * @jest-environment jsdom
 */
import { refreshToken } from "@packages/utils/auth/refreshToken.native";
import AsyncStorage from "@react-native-async-storage/async-storage";

jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
}));

beforeEach(() => {
  global.fetch = jest.fn();
});

describe("refreshToken.native", () => {
  const oldRefresh = "old.refresh";

  // ------ Test 1️⃣ ------
  it("returns accessToken and saves new refresh token if successful", async () => {
    const newAccess = "new.access";
    const newRefresh = "new.refresh";

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ accessToken: newAccess, refreshToken: newRefresh }),
    });

    const token = await refreshToken(oldRefresh);

    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/jwt-refresh"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: oldRefresh }),
    });

    expect(AsyncStorage.setItem).toHaveBeenCalledWith("refreshToken", newRefresh);
    expect(token).toBe(newAccess);
  });

  // ------ Test 2️⃣ ------
  it("returns null if response not ok", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false });

    const token = await refreshToken(oldRefresh);
    expect(token).toBeNull();
  });

  // ------ Test 3️⃣ ------
  it("returns null if accessToken or refreshToken missing", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ accessToken: null, refreshToken: null }),
    });

    const token = await refreshToken(oldRefresh);
    expect(token).toBeNull();
  });

  // ------ Test 4️⃣ ------
  it("returns null if fetch throws", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("network error"));

    const token = await refreshToken(oldRefresh);
    expect(token).toBeNull();
  });
});

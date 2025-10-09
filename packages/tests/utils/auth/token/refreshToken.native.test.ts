import { refreshToken } from "@traduxo/packages/utils/auth/token/refreshToken.native";
import * as SecureStore from "expo-secure-store";

jest.mock("expo-secure-store", () => ({
  __esModule: true,
  setItemAsync: jest.fn(),
}));

const mockSetItemAsync = SecureStore.setItemAsync as jest.Mock;

describe("refreshToken.native", () => {
  const oldRefresh = "old.refresh";

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  // ------ Test 1️⃣ ------
  it("returns accessToken and saves new refresh token if successful", async () => {
    const newAccess = "new.access";
    const newRefresh = "new.refresh";

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ accessToken: newAccess, refreshToken: newRefresh }),
    });

    const token = await refreshToken(oldRefresh);

    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/auth/jwt-refresh"), {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-client": "native" },
      body: JSON.stringify({ refreshToken: oldRefresh }),
    });

    expect(mockSetItemAsync).toHaveBeenCalledWith("refreshToken", newRefresh);
    expect(token).toBe(newAccess);
  });

  // ------ Test 2️⃣ ------
  it("returns null if response not ok", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false });
    const token = await refreshToken(oldRefresh);
    expect(token).toBeNull();
  });

  it("returns null if accessToken or refreshToken missing", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ accessToken: null, refreshToken: null }),
    });
    const token = await refreshToken(oldRefresh);
    expect(token).toBeNull();
  });

  // ------ Test 3️⃣ ------
  it("returns null if fetch throws", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("network error"));
    const token = await refreshToken(oldRefresh);
    expect(token).toBeNull();
  });

  // ------ Test 4️⃣ ------
  it("prevents double refresh calls", async () => {
    const newAccess = "new.access";
    const newRefresh = "new.refresh";

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ accessToken: newAccess, refreshToken: newRefresh }),
    });

    const [first, second] = await Promise.all([
      refreshToken(oldRefresh),
      refreshToken(oldRefresh),
    ]);

    expect(first).toBe(newAccess);
    expect(second).toBeNull(); // second call prevented by refreshing flag
  });
});

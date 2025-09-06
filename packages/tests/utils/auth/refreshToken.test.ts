/**
 * @jest-environment jsdom
 */
import { refreshToken } from "@packages/utils/auth/refreshToken";

const mockSetItem = jest.fn();

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: mockSetItem,
  },
}));

describe("refreshToken", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    process.env.PLATFORM = "react-native";
  });

  it("returns null if fetch fails", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("network"));

    const token = await refreshToken("old.token");
    expect(token).toBeNull();
  });

  it("returns null if response is not ok", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ accessToken: "a", refreshToken: "b" }),
    });

    const token = await refreshToken("old.token");
    expect(token).toBeNull();
  });

  it("returns null if response missing tokens", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    const token = await refreshToken("old.token");
    expect(token).toBeNull();
  });

  it("saves new tokens and returns accessToken if successful", async () => {
    const newAccess = "new.access";
    const newRefresh = "new.refresh";

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ accessToken: newAccess, refreshToken: newRefresh }),
    });

    const token = await refreshToken("old.token");

    expect(mockSetItem).toHaveBeenCalledWith("accessToken", newAccess);
    expect(mockSetItem).toHaveBeenCalledWith("refreshToken", newRefresh);
    expect(token).toBe(newAccess);
  });
});

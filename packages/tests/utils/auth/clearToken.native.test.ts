import { clearToken } from "@packages/utils/auth/clearToken.native";
import AsyncStorage from "@react-native-async-storage/async-storage";

jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    removeItem: jest.fn(),
  },
}));

const mockRemoveItem = AsyncStorage.removeItem as jest.Mock;

describe("clearToken.native", () => {
  // ------ Test 1️⃣ ------
  it("removes both access and refresh tokens", async () => {
    await clearToken();

    expect(mockRemoveItem).toHaveBeenCalledWith("accessToken");
    expect(mockRemoveItem).toHaveBeenCalledWith("refreshToken");
  });

  // ------ Test 2️⃣ ------
  it("throws if AsyncStorage.removeItem fails", async () => {
    mockRemoveItem.mockRejectedValueOnce(new Error("storage error"));

    await expect(clearToken()).rejects.toThrow("storage error");
  });
});

import { saveToken } from "@traduxo/packages/utils/auth/saveToken.native";
import AsyncStorage from "@react-native-async-storage/async-storage";

jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    setItem: jest.fn(),
  },
}));

const mockSetItem = AsyncStorage.setItem as jest.Mock;

describe("saveToken.native", () => {
  // ------ Test 1️⃣ ------
  it("saves both access and refresh tokens", async () => {
    await saveToken("access.token", "refresh.token");

    expect(mockSetItem).toHaveBeenNthCalledWith(1, "accessToken", "access.token");
    expect(mockSetItem).toHaveBeenNthCalledWith(2, "refreshToken", "refresh.token");
  });

  // ------ Test 2️⃣ ------
  it("throws if AsyncStorage.setItem fails", async () => {
    mockSetItem.mockRejectedValueOnce(new Error("storage error"));

    await expect(saveToken("access", "refresh")).rejects.toThrow("storage error");
  });
});

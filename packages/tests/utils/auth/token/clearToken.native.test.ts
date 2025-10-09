import { clearToken } from "@traduxo/packages/utils/auth/token/clearToken.native";
import * as SecureStore from "expo-secure-store";
import { clearAccessToken } from "@traduxo/packages/utils/auth/token/tokenStore";

jest.mock("expo-secure-store", () => ({
  __esModule: true,
  deleteItemAsync: jest.fn(),
}));

jest.mock("@traduxo/packages/utils/auth/token/tokenStore", () => ({
  clearAccessToken: jest.fn(),
}));

const mockDeleteItemAsync = SecureStore.deleteItemAsync as jest.Mock;
const mockClearAccessToken = clearAccessToken as jest.Mock;

describe("clearToken.native", () => {
  // ------ Test 1️⃣ ------
  it("removes both access and refresh tokens", async () => {
    await clearToken();

    expect(mockClearAccessToken).toHaveBeenCalled();
    expect(mockDeleteItemAsync).toHaveBeenCalledWith("accessToken");
    expect(mockDeleteItemAsync).toHaveBeenCalledWith("refreshToken");
    expect(mockDeleteItemAsync).toHaveBeenCalledTimes(2);
  });

  // ------ Test 2️⃣ ------
  it("throws if SecureStore.deleteItemAsync fails", async () => {
    mockDeleteItemAsync.mockRejectedValueOnce(new Error("storage error"));

    await expect(clearToken()).rejects.toThrow("storage error");
  });
});

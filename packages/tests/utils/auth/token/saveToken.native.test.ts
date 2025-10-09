import { saveToken } from "@traduxo/packages/utils/auth/token/saveToken.native";
import * as SecureStore from "expo-secure-store";
import { setAccessToken } from "@traduxo/packages/utils/auth/token/tokenStore";

jest.mock("expo-secure-store", () => ({
  __esModule: true,
  setItemAsync: jest.fn(),
}));

jest.mock("@traduxo/packages/utils/auth/token/tokenStore", () => ({
  setAccessToken: jest.fn(),
}));

const mockSetItemAsync = SecureStore.setItemAsync as jest.Mock;
const mockSetAccessToken = setAccessToken as jest.Mock;

describe("saveToken.native", () => {
  // ------ Test 1️⃣ ------
  it("saves both access and refresh tokens", async () => {
    await saveToken("access.token", "refresh.token");

    expect(mockSetAccessToken).toHaveBeenCalledWith("access.token");
    expect(mockSetItemAsync).toHaveBeenNthCalledWith(1, "accessToken", "access.token");
    expect(mockSetItemAsync).toHaveBeenNthCalledWith(2, "refreshToken", "refresh.token");
  });

  // ------ Test 2️⃣ ------
  it("saves only access token if refresh token is missing", async () => {
    await saveToken("only.access");

    expect(mockSetAccessToken).toHaveBeenCalledWith("only.access");
    expect(mockSetItemAsync).toHaveBeenCalledWith("accessToken", "only.access");
    expect(mockSetItemAsync).toHaveBeenCalledTimes(1);
  });

  // ------ Test 3️⃣ ------
  it("saves only refresh token if access token is missing", async () => {
    await saveToken(undefined, "only.refresh");

    expect(mockSetAccessToken).not.toHaveBeenCalled();
    expect(mockSetItemAsync).toHaveBeenCalledWith("refreshToken", "only.refresh");
    expect(mockSetItemAsync).toHaveBeenCalledTimes(1);
  });

  // ------ Test 4️⃣ ------
  it("throws if SecureStore.setItemAsync fails", async () => {
    mockSetItemAsync.mockRejectedValueOnce(new Error("storage error"));

    await expect(saveToken("access", "refresh")).rejects.toThrow("storage error");
  });
});

import { getToken } from "@traduxo/packages/utils/auth/token/getToken.native";
import * as SecureStore from "expo-secure-store";
import { refreshToken } from "@traduxo/packages/utils/auth/token/refreshToken.native";
import { jwtDecode } from "jwt-decode";
import { getAccessToken, setAccessToken } from "@traduxo/packages/utils/auth/token/tokenStore";

jest.mock("expo-secure-store", () => ({
  __esModule: true,
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
}));

jest.mock("@traduxo/packages/utils/auth/token/refreshToken.native", () => ({
  refreshToken: jest.fn(),
}));

jest.mock("jwt-decode", () => ({
  __esModule: true,
  jwtDecode: jest.fn(),
}));

jest.mock("@traduxo/packages/utils/auth/token/tokenStore", () => ({
  getAccessToken: jest.fn(),
  setAccessToken: jest.fn(),
}));

const mockGetItemAsync = SecureStore.getItemAsync as jest.Mock;
const mockSetItemAsync = SecureStore.setItemAsync as jest.Mock;
const mockJwtDecode = jwtDecode as jest.Mock;
const mockRefreshToken = refreshToken as jest.Mock;
const mockGetAccessToken = getAccessToken as jest.Mock;
const mockSetAccessToken = setAccessToken as jest.Mock;

describe("getToken.native", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  // ------ Test 1️⃣ ------
  it("returns null if no accessToken", async () => {
    mockGetAccessToken.mockReturnValue(null);
    mockGetItemAsync.mockImplementation((key: string) => Promise.resolve(null));

    const result = await getToken();
    expect(result).toBeNull();
  });

  // ------ Test 2️⃣ ------
  it("returns null if token is malformed", async () => {
    const token = "bad.token";
    mockGetAccessToken.mockReturnValue(null);
    mockGetItemAsync.mockImplementation((key: string) => {
      if (key === "accessToken") return Promise.resolve(token);
      return Promise.resolve(null);
    });
    mockJwtDecode.mockImplementation(() => { throw new Error("invalid"); });

    const result = await getToken();
    expect(result).toBeNull();
  });

  // ------ Test 3️⃣ ------
  it("returns null if expired and no refresh token", async () => {
    const oldToken = "expired.token";
    mockGetAccessToken.mockReturnValue(null);
    mockGetItemAsync.mockImplementation((key: string) => {
      if (key === "accessToken") return Promise.resolve(oldToken);
      if (key === "refreshToken") return Promise.resolve(null);
      return Promise.resolve(null);
    });
    mockJwtDecode.mockReturnValueOnce({ exp: Math.floor(Date.now() / 1000) - 10 });

    const result = await getToken();
    expect(result).toBeNull();
  });

  // ------ Test 4️⃣ ------
  it("returns null if refresh fails", async () => {
    const oldToken = "expired.token";
    const refresh = "refresh.token";
    mockGetAccessToken.mockReturnValue(null);
    mockGetItemAsync.mockImplementation((key: string) => {
      if (key === "accessToken") return Promise.resolve(oldToken);
      if (key === "refreshToken") return Promise.resolve(refresh);
      return Promise.resolve(null);
    });
    mockJwtDecode.mockReturnValueOnce({ exp: Math.floor(Date.now() / 1000) - 10 });
    mockRefreshToken.mockResolvedValueOnce(null);

    const result = await getToken();
    expect(mockRefreshToken).toHaveBeenCalledWith(refresh);
    expect(result).toBeNull();
  });

  // ------ Test 5️⃣ ------
  it("returns null if new token after refresh is malformed", async () => {
    const oldToken = "expired.token";
    const refresh = "refresh.token";
    const newToken = "new.token";

    mockGetAccessToken.mockReturnValue(null);
    mockGetItemAsync.mockImplementation((key: string) => {
      if (key === "accessToken") return Promise.resolve(oldToken);
      if (key === "refreshToken") return Promise.resolve(refresh);
      return Promise.resolve(null);
    });
    mockJwtDecode.mockReturnValueOnce({ exp: Math.floor(Date.now() / 1000) - 10 }); // old token expired
    mockRefreshToken.mockResolvedValueOnce(newToken);
    mockJwtDecode.mockImplementationOnce(() => { throw new Error("invalid new token"); });

    const result = await getToken();
    expect(mockRefreshToken).toHaveBeenCalledWith(refresh);
    expect(result).toBeNull();
  });

  // ------ Test 6️⃣ ------
  it("returns token if valid", async () => {
    const token = "valid.token";
    const payload = { exp: Math.floor(Date.now() / 1000) + 60, language: "en" };

    mockGetAccessToken.mockReturnValue(null);
    mockGetItemAsync.mockImplementation((key: string) => {
      if (key === "accessToken") return Promise.resolve(token);
      if (key === "refreshToken") return Promise.resolve(undefined);
      return Promise.resolve(null);
    });
    mockJwtDecode.mockReturnValueOnce(payload);

    const result = await getToken();
    expect(result).toEqual({
      token,
      refreshToken: undefined,
      language: "en",
      providers: undefined,
    });
  });

  // ------ Test 7️⃣ ------
  it("refreshes expired token and returns new token", async () => {
    const oldToken = "expired.token";
    const refresh = "refresh.token";
    const newToken = "new.token";

    const expiredPayload = { exp: Math.floor(Date.now() / 1000) - 10, language: "fr", providers: ["github"] };
    const newPayload = { exp: Math.floor(Date.now() / 1000) + 60, language: "fr", providers: ["github"] };

    mockGetAccessToken.mockReturnValue(null);
    mockGetItemAsync.mockImplementation((key: string) => {
      if (key === "accessToken") return Promise.resolve(oldToken);
      if (key === "refreshToken") return Promise.resolve(refresh);
      return Promise.resolve(null);
    });
    mockJwtDecode
      .mockReturnValueOnce(expiredPayload)
      .mockReturnValueOnce(newPayload);
    mockRefreshToken.mockResolvedValueOnce(newToken);

    const result = await getToken();

    expect(mockRefreshToken).toHaveBeenCalledWith(refresh);
    expect(mockSetItemAsync).toHaveBeenCalledWith("accessToken", newToken);
    expect(result).toEqual({
      token: newToken,
      refreshToken: refresh,
      language: "fr",
      providers: ["github"],
    });
  });

  // ------ Test 8️⃣ ------
  it("returns null if initial token is malformed but refresh returns a malformed token", async () => {
    const oldToken = "malformed.token";
    const refresh = "refresh.token";
    const newToken = "new.token";

    mockGetAccessToken.mockReturnValue(null);
    mockGetItemAsync.mockImplementation((key: string) => {
      if (key === "accessToken") return Promise.resolve(oldToken);
      if (key === "refreshToken") return Promise.resolve(refresh);
      return Promise.resolve(null);
    });
    mockJwtDecode.mockImplementationOnce(() => { throw new Error("invalid old token"); });
    mockRefreshToken.mockResolvedValueOnce(newToken);
    mockJwtDecode.mockImplementationOnce(() => { throw new Error("invalid new token"); });

    const result = await getToken();

    expect(mockRefreshToken).toHaveBeenCalledWith(refresh);
    expect(result).toBeNull();
  });
});

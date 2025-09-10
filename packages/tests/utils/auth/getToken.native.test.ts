import { getToken } from "@traduxo/packages/utils/auth/getToken.native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { refreshToken } from "@traduxo/packages/utils/auth/refreshToken.native";
import { jwtDecode } from "jwt-decode";

jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
  },
}));

jest.mock("@traduxo/packages/utils/auth/refreshToken.native", () => ({
  refreshToken: jest.fn(),
}));

jest.mock("jwt-decode", () => ({
  __esModule: true,
  jwtDecode: jest.fn(),
}));

const mockGetItem = AsyncStorage.getItem as jest.Mock;
const mockSetItem = AsyncStorage.setItem as jest.Mock;
const mockJwtDecode = jwtDecode as jest.Mock;

describe("getToken.native", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  // ------ Test 1️⃣ ------
  it("returns null if no accessToken", async () => {
    mockGetItem.mockResolvedValueOnce(null);
    expect(await getToken()).toBeNull();
  });

  // ------ Test 2️⃣ ------
  it("returns null if token is malformed", async () => {
    const token = "bad.token";
    mockGetItem.mockResolvedValueOnce(token);
    mockJwtDecode.mockImplementation(() => { throw new Error("invalid"); });

    expect(await getToken()).toBeNull();
  });

  // ------ Test 3️⃣ ------
  it("returns null if expired and no refresh token", async () => {
    const oldToken = "expired.token";
    mockGetItem.mockResolvedValueOnce(oldToken).mockResolvedValueOnce(null); // no refresh token
    mockJwtDecode.mockReturnValueOnce({ exp: Math.floor(Date.now() / 1000) - 10 });

    expect(await getToken()).toBeNull();
  });

  // ------ Test 4️⃣ ------
  it("returns null if refresh fails", async () => {
    const oldToken = "expired.token";
    const refresh = "refresh.token";
    mockGetItem.mockResolvedValueOnce(oldToken).mockResolvedValueOnce(refresh);
    mockJwtDecode.mockReturnValueOnce({ exp: Math.floor(Date.now() / 1000) - 10 });
    (refreshToken as jest.Mock).mockResolvedValueOnce(null);

    expect(await getToken()).toBeNull();
  });

  // ------ Test 5️⃣ ------
  it("returns null if new token after refresh is malformed", async () => {
    const oldToken = "expired.token";
    const refresh = "refresh.token";
    const newToken = "new.token";

    mockGetItem.mockResolvedValueOnce(oldToken).mockResolvedValueOnce(refresh);
    mockJwtDecode.mockReturnValueOnce({ exp: Math.floor(Date.now() / 1000) - 10 }); // old token expired
    (refreshToken as jest.Mock).mockResolvedValueOnce(newToken);
    mockJwtDecode.mockImplementationOnce(() => { throw new Error("invalid new token"); });

    expect(await getToken()).toBeNull();
  });

  // ------ Test 6️⃣ ------
  it("returns token if valid", async () => {
    const token = "valid.token";
    const payload = { exp: Math.floor(Date.now() / 1000) + 60, language: "en" };

    mockGetItem.mockResolvedValueOnce(token);
    mockJwtDecode.mockReturnValueOnce(payload);

    const result = await getToken();
    expect(result).toEqual({ token, language: "en", providers: undefined });
  });

  // ------ Test 7️⃣ ------
  it("refreshes expired token and returns new token", async () => {
    const oldToken = "expired.token";
    const refresh = "refresh.token";
    const newToken = "new.token";

    mockGetItem.mockResolvedValueOnce(oldToken).mockResolvedValueOnce(refresh);
    mockJwtDecode
      .mockReturnValueOnce({ exp: Math.floor(Date.now() / 1000) - 10, language: "fr", providers: ["github"] })
      .mockReturnValueOnce({ exp: Math.floor(Date.now() / 1000) + 60, language: "fr", providers: ["github"] });
    (refreshToken as jest.Mock).mockResolvedValueOnce(newToken);

    const result = await getToken();

    expect(refreshToken).toHaveBeenCalledWith(refresh, oldToken);
    expect(mockSetItem).toHaveBeenCalledWith("accessToken", newToken);
    expect(result).toEqual({ token: newToken, language: "fr", providers: ["github"] });
  });
});

/**
 * @jest-environment jsdom
 */
import { getToken } from "@packages/utils/auth/getToken";
import { refreshToken } from "@packages/utils/auth/refreshToken";

const mockGetItem = jest.fn();
const mockSetItem = jest.fn();

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: mockGetItem,
    setItem: mockSetItem,
  },
}));

// Mock jwt-decode
const mockJwtDecode = jest.fn();
jest.mock("jwt-decode", () => ({
  __esModule: true,
  default: (token: string) => mockJwtDecode(token),
}));

// Mock refreshToken
jest.mock("@packages/utils/auth/refreshToken", () => ({
  refreshToken: jest.fn(),
}));

describe("getToken", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    process.env.PLATFORM = "react-native";
  });

  it("returns null if no accessToken", async () => {
    mockGetItem.mockResolvedValueOnce(null);
    const token = await getToken();
    expect(token).toBeNull();
  });

  it("returns token if valid", async () => {
    const fakeToken = "valid.token.here";
    mockGetItem.mockResolvedValueOnce(fakeToken);
    mockJwtDecode.mockReturnValueOnce({ exp: Math.floor(Date.now() / 1000) + 60 });

    const token = await getToken();
    expect(token).toBe(fakeToken);
  });

  it("returns null if token malformed", async () => {
    const fakeToken = "malformed.token";
    mockGetItem.mockResolvedValueOnce(fakeToken);
    mockJwtDecode.mockImplementation(() => {
      throw new Error("invalid token");
    });

    const token = await getToken();
    expect(token).toBeNull();
  });

  it("refreshes token if expired and returns new token", async () => {
    const oldToken = "expired.token";
    const refreshTokenValue = "refresh.token";
    const newToken = "new.token";

    mockGetItem
      .mockResolvedValueOnce(oldToken) // accessToken
      .mockResolvedValueOnce(refreshTokenValue); // refreshToken

    mockJwtDecode.mockReturnValueOnce({ exp: Math.floor(Date.now() / 1000) - 10 });
    (refreshToken as jest.Mock).mockResolvedValueOnce(newToken);

    const token = await getToken();
    expect(refreshToken).toHaveBeenCalledWith(refreshTokenValue);
    expect(token).toBe(newToken);
  });

  it("returns null if expired and no refresh token", async () => {
    const oldToken = "expired.token";

    mockGetItem
      .mockResolvedValueOnce(oldToken) // accessToken
      .mockResolvedValueOnce(null); // refreshToken

    mockJwtDecode.mockReturnValueOnce({ exp: Math.floor(Date.now() / 1000) - 10 });

    const token = await getToken();
    expect(token).toBeNull();
  });

  it("returns null if refresh fails", async () => {
    const oldToken = "expired.token";
    const refreshTokenValue = "refresh.token";

    mockGetItem
      .mockResolvedValueOnce(oldToken) // accessToken
      .mockResolvedValueOnce(refreshTokenValue); // refreshToken

    mockJwtDecode.mockReturnValueOnce({ exp: Math.floor(Date.now() / 1000) - 10 });
    (refreshToken as jest.Mock).mockResolvedValueOnce(null);

    const token = await getToken();
    expect(token).toBeNull();
  });
});

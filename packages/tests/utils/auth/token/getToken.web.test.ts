import { getToken } from "@traduxo/packages/utils/auth/token";
import { jwtDecode } from "jwt-decode";
import * as tokenStore from "@traduxo/packages/utils/auth/token/tokenStore";
import * as refreshModule from "@traduxo/packages/utils/auth/token/refreshToken.web";

jest.mock("jwt-decode");
jest.mock("@traduxo/packages/utils/auth/token/tokenStore");
jest.mock("@traduxo/packages/utils/auth/token/refreshToken.web");

const mockJwtDecode = jwtDecode as jest.Mock;
const mockGetAccessToken = tokenStore.getAccessToken as jest.Mock;
const mockSetAccessToken = tokenStore.setAccessToken as jest.Mock;
const mockRefreshToken = refreshModule.refreshToken as jest.Mock;

beforeEach(() => {
  jest.resetAllMocks();
  mockGetAccessToken.mockReturnValue(null);
  mockSetAccessToken.mockImplementation(() => {});
});

describe("getToken.web", () => {
  // ------ Test 1️⃣ ------
  it("returns null if no access token", async () => {
    const tokenData = await getToken();
    expect(tokenData).toBeNull();
  });

  // ------ Test 2️⃣ ------
  it("returns token if valid and not expired", async () => {
    const token = "valid.token";
    mockGetAccessToken.mockReturnValue(token);
    mockJwtDecode.mockReturnValueOnce({
      exp: Math.floor(Date.now() / 1000) + 60,
      language: "en",
      providers: ["google"],
    });

    const tokenData = await getToken();
    expect(tokenData).toEqual({ token, language: "en", providers: ["google"] });
  });

  // ------ Test 3️⃣ ------
  it("returns null if token is malformed", async () => {
    const token = "malformed.token";
    mockGetAccessToken.mockReturnValue(token);
    mockJwtDecode.mockImplementation(() => { throw new Error("invalid"); });

    const tokenData = await getToken();
    expect(tokenData).toBeNull();
  });

  // ------ Test 4️⃣ ------
  it("refreshes expired token via refreshToken and returns new token", async () => {
    const oldToken = "expired.token";
    const newToken = "new.token";
    mockGetAccessToken.mockReturnValue(oldToken);
    mockJwtDecode.mockReturnValueOnce({ exp: Math.floor(Date.now() / 1000) - 10 });
    mockRefreshToken.mockResolvedValueOnce(newToken);
    mockJwtDecode.mockReturnValueOnce({ exp: Math.floor(Date.now() / 1000) + 60, language: "fr", providers: ["github"] });

    const tokenData = await getToken();

    expect(mockRefreshToken).toHaveBeenCalledWith(oldToken);
    expect(mockSetAccessToken).toHaveBeenCalledWith(newToken);
    expect(tokenData).toEqual({ token: newToken, language: "fr", providers: ["github"] });
  });

  // ------ Test 5️⃣ ------
  it("returns null if refreshToken fails", async () => {
    const oldToken = "expired.token";
    mockGetAccessToken.mockReturnValue(oldToken);
    mockJwtDecode.mockReturnValueOnce({ exp: Math.floor(Date.now() / 1000) - 10 });
    mockRefreshToken.mockResolvedValueOnce(null);

    const tokenData = await getToken();
    expect(mockRefreshToken).toHaveBeenCalledWith(oldToken);
    expect(tokenData).toBeNull();
  });

  // ------ Test 6️⃣ ------
  it("returns null if refreshed token is malformed", async () => {
    const oldToken = "expired.token";
    const newToken = "new.token";
    mockGetAccessToken.mockReturnValue(oldToken);
    mockJwtDecode.mockReturnValueOnce({ exp: Math.floor(Date.now() / 1000) - 10 });
    mockRefreshToken.mockResolvedValueOnce(newToken);
    mockJwtDecode.mockImplementationOnce(() => { throw new Error("invalid new token"); });

    const tokenData = await getToken();
    expect(mockRefreshToken).toHaveBeenCalledWith(oldToken);
    expect(tokenData).toBeNull();
  });
});

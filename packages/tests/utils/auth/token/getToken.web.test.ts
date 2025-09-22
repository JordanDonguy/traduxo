/**
 * @jest-environment jsdom
 */

import { getToken } from "@traduxo/packages/utils/auth/token";
import * as refreshTokenModule from "@traduxo/packages/utils/auth/token";
import { jwtDecode } from "jwt-decode";

jest.mock("@traduxo/packages/utils/auth/token/refreshToken.web");
jest.mock("jwt-decode");

const mockJwtDecode = jwtDecode as unknown as jest.Mock;
const mockRefreshToken = refreshTokenModule.refreshToken as jest.Mock;

beforeAll(() => {
  // Polyfill localStorage
  let store: Record<string, string> = {};
  Object.defineProperty(global, "localStorage", {
    value: {
      getItem: jest.fn((key) => store[key] || null),
      setItem: jest.fn((key, value) => { store[key] = value; }),
      removeItem: jest.fn((key) => { delete store[key]; }),
      clear: jest.fn(() => { store = {}; }),
    },
    writable: true,
  });
});

beforeEach(() => {
  localStorage.clear();
});

describe("getToken.web", () => {
  // ------ Test 1️⃣ ------
  it("returns null if no accessToken", async () => {
    const tokenData = await getToken();
    expect(tokenData).toBeNull();
  });

  // ------ Test 2️⃣ ------
  it("returns token if valid and not expired", async () => {
    const token = "valid.token";
    localStorage.setItem("accessToken", token);

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
    localStorage.setItem("accessToken", token);

    mockJwtDecode.mockImplementation(() => { throw new Error("invalid"); });

    const tokenData = await getToken();
    expect(tokenData).toBeNull();
  });

  // ------ Test 4️⃣ ------
  it("refreshes expired token and returns new token", async () => {
    const oldToken = "expired.token";
    const refresh = "refresh.token";
    const newToken = "new.token";

    localStorage.setItem("accessToken", oldToken);
    localStorage.setItem("refreshToken", refresh);

    mockJwtDecode
      .mockReturnValueOnce({ exp: Math.floor(Date.now() / 1000) - 10, language: "fr", providers: ["github"] })
      .mockReturnValueOnce({ exp: Math.floor(Date.now() / 1000) + 60, language: "fr", providers: ["github"] });

    mockRefreshToken.mockResolvedValueOnce(newToken);

    const tokenData = await getToken();

    expect(mockRefreshToken).toHaveBeenCalledWith(refresh, oldToken);
    expect(localStorage.getItem("accessToken")).toBe(newToken);
    expect(tokenData).toEqual({ token: newToken, language: "fr", providers: ["github"] });
  });

  // ------ Test 5️⃣ ------
  it("returns null if expired and no refresh token", async () => {
    const oldToken = "expired.token";
    localStorage.setItem("accessToken", oldToken);

    mockJwtDecode.mockReturnValueOnce({ exp: Math.floor(Date.now() / 1000) - 10 });

    const tokenData = await getToken();
    expect(tokenData).toBeNull();
  });

  // ------ Test 6️⃣ ------
  it("returns null if refresh fails", async () => {
    const oldToken = "expired.token";
    const refresh = "refresh.token";
    localStorage.setItem("accessToken", oldToken);
    localStorage.setItem("refreshToken", refresh);

    mockJwtDecode.mockReturnValueOnce({ exp: Math.floor(Date.now() / 1000) - 10 });
    mockRefreshToken.mockResolvedValueOnce(null);

    const tokenData = await getToken();
    expect(tokenData).toBeNull();
  });

  // ------ Test 7️⃣ ------
  it("returns null if new token after refresh is malformed", async () => {
    const oldToken = "malformed.token";
    const refresh = "refresh.token";
    const newToken = "new.token";

    localStorage.setItem("accessToken", oldToken);
    localStorage.setItem("refreshToken", refresh);

    // First decode fails → triggers refresh
    mockJwtDecode.mockImplementationOnce(() => { throw new Error("invalid token"); });
    // After refresh, decoding also fails
    mockRefreshToken.mockResolvedValueOnce(newToken);
    mockJwtDecode.mockImplementationOnce(() => { throw new Error("invalid new token"); });

    const tokenData = await getToken();

    expect(mockRefreshToken).toHaveBeenCalledWith(refresh, oldToken);
    expect(tokenData).toBeNull();
  });

  // ------ Test 8️⃣ ------
  it("returns null if refresh fails for malformed token", async () => {
    const oldToken = "malformed.token";
    const refresh = "refresh.token";

    localStorage.setItem("accessToken", oldToken);
    localStorage.setItem("refreshToken", refresh);

    mockJwtDecode.mockImplementationOnce(() => { throw new Error("invalid token"); });
    mockRefreshToken.mockResolvedValueOnce(null); // refresh fails

    const tokenData = await getToken();

    expect(mockRefreshToken).toHaveBeenCalledWith(refresh, oldToken);
    expect(tokenData).toBeNull();
  });

  // ------ Test 9️⃣ ------
  it("includes refreshToken when returnRefreshToken is true", async () => {
    const token = "valid.token";
    const refresh = "refresh.token";

    localStorage.setItem("accessToken", token);
    localStorage.setItem("refreshToken", refresh);

    mockJwtDecode.mockReturnValueOnce({
      exp: Math.floor(Date.now() / 1000) + 60,
      language: "en",
      providers: ["google"],
    });

    const tokenData = await getToken(true);
    expect(tokenData).toEqual({ token, language: "en", providers: ["google"], refreshToken: refresh });
  });
});

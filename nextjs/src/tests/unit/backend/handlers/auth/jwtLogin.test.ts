import { NextRequest } from "next/server";
import * as tokenModule from "@/lib/server/auth/generateToken";
import { jwtLoginHandler } from "@/lib/server/handlers/auth/jwtLogin";
import * as authModule from "@/lib/server/auth/authorizeUser";

describe("jwtLoginHandler", () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeAll(() => {
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => { });
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => { });
  });

  // ------ Test 1️⃣ ------
  it("fails if missing credentials", async () => {
    const req = {
      json: async () => ({}),
      headers: new Headers(),
    } as unknown as NextRequest;

    const res = await jwtLoginHandler(req, {});
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("Missing credentials");
  });

  // ------ Test 2️⃣ ------
  it("fails if authorizeUser returns invalid credentials", async () => {
    jest.spyOn(authModule, "authorizeUser").mockResolvedValue({
      success: false,
      reason: "Invalid credentials",
    });

    const req = {
      json: async () => ({ email: "a@b.com", password: "123" }),
      headers: new Headers(),
    } as unknown as NextRequest;

    const res = await jwtLoginHandler(req, {});
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe("Invalid credentials");
  });

  // ------ Test 3️⃣ ------
  it("returns tokens for web clients (sets cookie)", async () => {
    jest.spyOn(authModule, "authorizeUser").mockResolvedValue({
      success: true,
      user: {
        id: "user1",
        email: "a@b.com",
        language: "en",
        providers: ["google"],
      },
    });

    jest.spyOn(tokenModule, "generateToken").mockResolvedValue({
      accessToken: "jwt-token",
      refreshToken: "refresh-token",
      expiresIn: 3600,
    });

    const req = {
      json: async () => ({ email: "a@b.com", password: "123" }),
      headers: new Headers(), // no x-client → web
    } as unknown as NextRequest;

    const res = await jwtLoginHandler(req, {});
    const json = await res.json();

    expect(json).toEqual({
      token: "jwt-token",
      language: "en",
      providers: ["google"],
    });

    // Refresh token is set in cookie, not in body
    const setCookie = res.cookies.get("refreshToken");
    expect(setCookie?.value).toBe("refresh-token");

    // Check that generateToken was called correctly
    expect(tokenModule.generateToken).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user1",
        email: "a@b.com",
        language: "en",
        providers: ["google"],
      })
    );
  });

  // ------ Test 4️⃣ ------
  it("returns tokens for native clients (returns refreshToken in JSON)", async () => {
    jest.spyOn(authModule, "authorizeUser").mockResolvedValue({
      success: true,
      user: {
        id: "user-native",
        email: "native@user.com",
        language: "fr",
        providers: [],
      },
    });

    jest.spyOn(tokenModule, "generateToken").mockResolvedValue({
      accessToken: "native-access",
      refreshToken: "native-refresh",
      expiresIn: 3600,
    });

    const req = {
      json: async () => ({ email: "native@user.com", password: "pwd" }),
      headers: new Headers({ "x-client": "native" }),
    } as unknown as NextRequest;

    const res = await jwtLoginHandler(req, {});
    const json = await res.json();

    // For native, refreshToken is in the JSON response
    expect(json).toEqual({
      token: "native-access",
      language: "fr",
      providers: [],
      refreshToken: "native-refresh",
    });
  });

  // ------ Test 5️⃣ ------
  it("returns 500 if an unexpected error occurs", async () => {
    jest.spyOn(authModule, "authorizeUser").mockImplementation(() => {
      throw new Error("Unexpected failure");
    });

    const req = {
      json: async () => ({ email: "fail@case.com", password: "123" }),
      headers: new Headers(),
    } as unknown as NextRequest;

    const res = await jwtLoginHandler(req, {});
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Internal server error");
  });
});

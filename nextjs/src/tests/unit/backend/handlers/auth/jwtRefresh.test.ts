import { NextRequest } from "next/server";
import { refreshTokenHandler } from "@/lib/server/handlers/auth/jwtRefresh";
import { mockPrisma } from "@/tests/jest.setup";
import * as tokenModule from "@/lib/server/auth/generateToken";
import bcrypt from "bcrypt";

jest.mock("bcrypt");

describe("refreshTokenHandler", () => {
  // ------ Test 1️⃣ ------
  it("returns 400 if missing refreshToken (native)", async () => {
    const req = {
      headers: new Map([["x-client", "native"]]),
      json: async () => ({}),
    } as unknown as NextRequest;

    const res = await refreshTokenHandler(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("Missing refresh token");
  });

  // ------ Test 2️⃣ ------
  it("returns 400 if missing refreshToken (web, cookie path)", async () => {
    const req = {
      headers: new Map(),
      cookies: { get: () => undefined },
      json: async () => ({}),
    } as unknown as NextRequest;

    const res = await refreshTokenHandler(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("Missing refresh token");
  });

  // ------ Test 3️⃣ ------
  it("returns 401 if no matching refresh token found", async () => {
    mockPrisma.refreshToken.findMany.mockResolvedValue([
      { id: "1", token: "hashed", userId: "user1" },
    ]);
    (bcrypt.compareSync as jest.Mock).mockReturnValue(false);

    const req = {
      headers: new Map([["x-client", "native"]]),
      json: async () => ({ refreshToken: "wrong" }),
    } as unknown as NextRequest;

    const res = await refreshTokenHandler(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe("Invalid or expired refresh token");
  });

  // ------ Test 4️⃣ ------
  it("returns 404 if user not found", async () => {
    const tokenRecord = { id: "1", token: "hashed", userId: "user1" };
    mockPrisma.refreshToken.findMany.mockResolvedValue([tokenRecord]);
    (bcrypt.compareSync as jest.Mock).mockReturnValue(true);
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const req = {
      headers: new Map([["x-client", "native"]]),
      json: async () => ({ refreshToken: "valid" }),
    } as unknown as NextRequest;

    const res = await refreshTokenHandler(req);
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error).toBe("User not found");
  });

  // ------ Test 5️⃣ ------
  it("creates new tokens successfully (native)", async () => {
    const tokenRecord = { id: "1", token: "hashed", userId: "user1" };
    const user = { id: "user1", email: "a@b.com", systemLang: "en", providers: ["google"] };
    mockPrisma.refreshToken.findMany.mockResolvedValue([tokenRecord]);
    mockPrisma.user.findUnique.mockResolvedValue(user);
    (bcrypt.compareSync as jest.Mock).mockReturnValue(true);

    jest.spyOn(tokenModule, "generateToken").mockResolvedValue({
      accessToken: "new-access",
      refreshToken: "new-refresh",
      expiresIn: 3600,
    });

    const req = {
      headers: new Map([["x-client", "native"]]),
      json: async () => ({ refreshToken: "valid" }),
    } as unknown as NextRequest;

    const res = await refreshTokenHandler(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.token).toBe("new-access");
    expect(json.refreshToken).toBe("new-refresh");
    expect(json.language).toBe("en");
  });

  // ------ Test 6️⃣ ------
  it("creates new tokens and sets cookie for web clients", async () => {
    const tokenRecord = { id: "1", token: "hashed", userId: "user1" };
    const user = { id: "user1", email: "a@b.com", systemLang: "fr", providers: [] };
    mockPrisma.refreshToken.findMany.mockResolvedValue([tokenRecord]);
    mockPrisma.user.findUnique.mockResolvedValue(user);
    (bcrypt.compareSync as jest.Mock).mockReturnValue(true);

    jest.spyOn(tokenModule, "generateToken").mockResolvedValue({
      accessToken: "jwt-access",
      refreshToken: "cookie-refresh",
      expiresIn: 3600,
    });

    const req = {
      headers: new Map(),
      cookies: { get: () => ({ value: "refresh-token" }) },
      json: async () => ({}),
    } as unknown as NextRequest;

    const res = await refreshTokenHandler(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.token).toBe("jwt-access");
    expect(json.language).toBe("fr");
    expect(json.providers).toEqual([]);
  });

  // ------ Test 7️⃣ ------
  it("returns 500 if unexpected error occurs", async () => {
    mockPrisma.refreshToken.findMany.mockRejectedValue(new Error("DB down"));

    const req = {
      headers: new Map([["x-client", "native"]]),
      json: async () => ({ refreshToken: "any" }),
    } as unknown as NextRequest;

    const res = await refreshTokenHandler(req);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe("Internal server error");
  });
});

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
  it("creates new tokens successfully (native, old token >1 day)", async () => {
    const oldTokenCreatedAt = new Date(Date.now() - 1000 * 60 * 60 * 25); // 25 hours ago
    const tokenRecord = { id: "1", token: "hashed", userId: "user1", createdAt: oldTokenCreatedAt };
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
  it("does not rotate refresh token if recent (<1 day) for web", async () => {
    const recentTokenCreatedAt = new Date(Date.now() - 1000 * 60 * 60 * 12); // 12 hours ago
    const tokenRecord = { id: "1", token: "hashed", userId: "user1", createdAt: recentTokenCreatedAt };
    const user = { id: "user1", email: "a@b.com", systemLang: "fr", providers: [] };

    mockPrisma.refreshToken.findMany.mockResolvedValue([tokenRecord]);
    mockPrisma.user.findUnique.mockResolvedValue(user);
    (bcrypt.compareSync as jest.Mock).mockReturnValue(true);

    jest.spyOn(tokenModule, "generateToken");

    const req = {
      headers: new Map(),
      cookies: { get: () => ({ value: "refresh-token" }) },
      json: async () => ({}),
    } as unknown as NextRequest;

    const res = await refreshTokenHandler(req);
    const json = await res.json();

    expect(res.status).toBe(200);

    // Access token is newly minted JWT
    expect(json.token).toMatch(/^ey/); // JWT format

    // Web clients do NOT return refresh token in JSON
    expect(json.refreshToken).toBeUndefined();

    expect(json.language).toBe("fr");
    expect(json.providers).toEqual([]);

    // No new refresh token was generated
    expect(tokenModule.generateToken).not.toHaveBeenCalled();

    // Check that cookie was set to the existing refresh token
    const cookie = res.cookies.get("refreshToken");
    expect(cookie?.value).toBe("refresh-token");
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

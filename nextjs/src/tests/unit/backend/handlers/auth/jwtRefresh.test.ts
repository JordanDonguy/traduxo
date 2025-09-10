import { NextRequest } from "next/server";
import * as tokenModule from "@/lib/server/auth/generateToken";
import { refreshTokenHandler } from "@/lib/server/handlers/auth/jwtRefresh";
import { mockPrisma } from "@/tests/jest.setup";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

jest.mock("jsonwebtoken", () => ({
  verify: jest.fn(),
  decode: jest.fn(),
}));

jest.mock("bcrypt");

describe("refreshTokenHandler", () => {
  const rawRefreshToken = "new-refresh-token";
  const hexRefreshToken = Buffer.from(rawRefreshToken, "utf-8").toString("hex");

  beforeEach(() => {
    (jwt.verify as jest.Mock).mockReturnValue({ sub: "user1" });
    (jwt.decode as jest.Mock).mockReturnValue({ sub: "user1" });
  });

  // ------ Test 1️⃣ ------
  it("returns 400 if no refreshToken in body", async () => {
    const req = { json: async () => ({}) } as unknown as NextRequest;
    const res = await refreshTokenHandler(req, { prismaClient: mockPrisma, bcryptFn: bcrypt });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("Missing refresh token");
  });

  // ------ Test 2️⃣ ------
  it("returns 400 if no accessToken in body", async () => {
    const req = { json: async () => ({ refreshToken: "abc" }) } as unknown as NextRequest;
    const res = await refreshTokenHandler(req, { prismaClient: mockPrisma, bcryptFn: bcrypt });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("Missing access token");
  });

  // ------ Test 3️⃣ ------
  it("falls back to decode and extracts userId from sub if verify fails", async () => {
    const tokenRecord = { id: "1", token: "hashed", userId: "user1" };
    const user = { id: "user1", email: "a@b.com", systemLang: "en", providers: ["google"] };

    // Trigger verify to throw
    (jwt.verify as jest.Mock).mockImplementation(() => { throw new Error("invalid signature"); });

    // decode returns a valid sub
    (jwt.decode as jest.Mock).mockReturnValue({ sub: "user1" });

    mockPrisma.refreshToken.findMany.mockResolvedValue([tokenRecord]);
    mockPrisma.user.findUnique.mockResolvedValue(user);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    jest.spyOn(tokenModule, "generateToken").mockResolvedValue({
      accessToken: "jwt-access",
      refreshToken: "new-refresh",
      expiresIn: 3600,
    });

    const req = { json: async () => ({ refreshToken: "valid", accessToken: "expired-jwt" }) } as unknown as NextRequest;
    const res = await refreshTokenHandler(req, { prismaClient: mockPrisma, bcryptFn: bcrypt });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.accessToken).toBe("jwt-access");
    expect(json.refreshToken).toBe("new-refresh");
    expect(json.expiresIn).toBe(3600);
  });

  // ------ Test 4️⃣ ------
  it("returns 401 if refresh token not found", async () => {
    mockPrisma.refreshToken.findMany.mockResolvedValue([]); // no tokens for that user

    const req = { json: async () => ({ refreshToken: "abc", accessToken: "expired-jwt" }) } as unknown as NextRequest;
    const res = await refreshTokenHandler(req, { prismaClient: mockPrisma, bcryptFn: bcrypt });
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe("Invalid or expired refresh token");
  });

  // ------ Test 5️⃣ ------
  it("returns 401 if refresh token invalid", async () => {
    const tokenRecord = { id: "1", token: "hashed", userId: "user1" };
    mockPrisma.refreshToken.findMany.mockResolvedValue([tokenRecord]);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const req = { json: async () => ({ refreshToken: "wrong", accessToken: "expired-jwt" }) } as unknown as NextRequest;
    const res = await refreshTokenHandler(req, { prismaClient: mockPrisma, bcryptFn: bcrypt });
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe("Invalid or expired refresh token");
  });

  // ------ Test 6️⃣ ------
  it("returns 401 if userId cannot be determined after decode", async () => {
    const req = { json: async () => ({ refreshToken: "abc", accessToken: "expired-jwt" }) } as unknown as NextRequest;

    // Make verify throw and decode returns null
    (jwt.verify as jest.Mock).mockImplementation(() => { throw new Error("invalid signature"); });
    (jwt.decode as jest.Mock).mockReturnValue(null);

    const res = await refreshTokenHandler(req, { prismaClient: mockPrisma, bcryptFn: bcrypt });
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe("Invalid access token");
  });

  // ------ Test 7️⃣ ------
  it("returns 404 if user not found", async () => {
    const tokenRecord = { id: "1", token: "hashed", userId: "user1" };
    mockPrisma.refreshToken.findMany.mockResolvedValue([tokenRecord]);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const req = { json: async () => ({ refreshToken: "valid", accessToken: "expired-jwt" }) } as unknown as NextRequest;
    const res = await refreshTokenHandler(req, { prismaClient: mockPrisma, bcryptFn: bcrypt });
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error).toBe("User not found");
  });

  // ------ Test 8️⃣ ------
  it("creates new tokens and deletes old token if valid", async () => {
    const tokenRecord = { id: "1", token: "hashed", userId: "user1" };
    const user = { id: "user1", email: "a@b.com", systemLang: "en", providers: ["google"] };

    mockPrisma.refreshToken.findMany.mockResolvedValue([tokenRecord]);
    mockPrisma.user.findUnique.mockResolvedValue(user);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    jest.spyOn(tokenModule, "generateToken").mockResolvedValue({
      accessToken: "jwt-access",
      refreshToken: hexRefreshToken,
      expiresIn: 3600,
    });

    const req = { json: async () => ({ refreshToken: "valid", accessToken: "expired-jwt" }) } as unknown as NextRequest;
    const res = await refreshTokenHandler(req, { prismaClient: mockPrisma, bcryptFn: bcrypt });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.accessToken).toBe("jwt-access");
    expect(json.refreshToken).toBe(hexRefreshToken);
    expect(json.expiresIn).toBe(3600);
  });

  // ------ Test 9️⃣ ------
  it("returns 500 if an unexpected error occurs", async () => {
    const faultyPrisma = {
      refreshToken: {
        findMany: jest.fn().mockImplementation(() => { throw new Error("DB down"); }),
      },
      user: {
        findUnique: jest.fn(),
      },
    };

    const req = { json: async () => ({ refreshToken: "abc", accessToken: "expired-jwt" }) } as unknown as NextRequest;
    const res = await refreshTokenHandler(req, { prismaClient: faultyPrisma, bcryptFn: bcrypt });
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Internal server error");
  });
});

/* eslint-disable @typescript-eslint/no-explicit-any */
import { generateToken, GenerateTokenOptions } from "@/lib/server/auth/generateToken";
import { prisma } from "@/lib/server/prisma";
import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// ---- Mocks ----
const mockPrisma = {
  refreshToken: { create: jest.fn() },
};

const mockCrypto = {
  randomBytes: jest.fn(() => Buffer.from("random-refresh-token")),
};

const mockBcrypt = {
  hash: jest.fn(async (token: string) => `${token}`),
};

const mockJwt = {
  sign: jest.fn(() => "jwt-token"),
};

// ---- Tests ----
describe("generateToken", () => {

  // ------ Test 1️⃣ ------
  it("generates access and refresh tokens and stores hashed refresh token", async () => {
    const opts: GenerateTokenOptions = {
      userId: "user1",
      email: "a@b.com",
      language: "en",
      providers: ["google"],
      prismaClient: mockPrisma as any,
      cryptoFn: mockCrypto as any,
      bcryptFn: mockBcrypt as any,
      jwtFn: mockJwt as any,
      accessTokenExpiresIn: "2h",
      refreshTokenExpiryDays: 10,
    };

    const result = await generateToken(opts);

    // Access token
    expect(mockJwt.sign).toHaveBeenCalledWith(
      { sub: "user1", email: "a@b.com", language: "en", providers: ["google"] },
      expect.any(String),
      { expiresIn: "2h" }
    );
    expect(result.accessToken).toBe("jwt-token");

    // Refresh token
    const hexString = Buffer.from("random-refresh-token").toString("hex");
    expect(mockBcrypt.hash).toHaveBeenCalledWith(hexString, 10);
    expect(result.refreshToken).toBe(hexString);

    // DB storage
    expect(mockPrisma.refreshToken.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          token: hexString,
          userId: "user1",
          expiresAt: expect.any(Date),
        }),
      })
    );

    // Expires in returned correctly
    expect(result.expiresIn).toBe(3600); // default numeric conversion for "2h"
  });

  // ------ Test 2️⃣ ------
  it("defaults refreshTokenExpiryDays to 30", async () => {
    const opts: GenerateTokenOptions = {
      userId: "user2",
      email: "b@c.com",
      prismaClient: mockPrisma as any,
      cryptoFn: mockCrypto as any,
      bcryptFn: mockBcrypt as any,
      jwtFn: mockJwt as any,
      accessTokenExpiresIn: "1h",
      // -> no refreshTokenExpiryDays passed
    };

    await generateToken(opts);

    const callArgs = mockPrisma.refreshToken.create.mock.calls[0][0];
    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() + 30);

    expect(callArgs.data.expiresAt.getDate()).toBe(expectedDate.getDate());
  });

  // ------ Test 3️⃣ ------
  it("returns numeric expiresIn when accessTokenExpiresIn is number", async () => {
    const opts: GenerateTokenOptions = {
      userId: "user3",
      email: "c@b.com",
      prismaClient: mockPrisma as any,
      cryptoFn: mockCrypto as any,
      bcryptFn: mockBcrypt as any,
      jwtFn: mockJwt as any,
      accessTokenExpiresIn: 7200,
    };

    const result = await generateToken(opts);
    expect(result.expiresIn).toBe(7200);
  });

  // ------ Test 4️⃣ ------
  it("generates access and refresh tokens and stores hashed refresh token using real modules", async () => {
    // Spy on real dependencies
    const randomBytesSpy = jest.spyOn(crypto, "randomBytes").mockImplementation(() => Buffer.from("random-refresh-token"));
    const bcryptHashSpy = jest.spyOn(bcrypt, "hash").mockImplementation(async (val) => val);
    const jwtSignSpy = jest.spyOn(jwt, "sign").mockImplementation(() => "jwt-token");
    const prismaCreateSpy = jest.spyOn(prisma.refreshToken, "create").mockResolvedValue({
      id: "token1",
      userId: "user1",
      token: "random-refresh-token",
      expiresAt: new Date(),
      createdAt: new Date(),
      revoked: false,
    });

    const opts: GenerateTokenOptions = {
      userId: "user1",
      email: "a@b.com",
      language: "en",
      providers: ["google"],
    };

    const result = await generateToken(opts);

    // Access token
    expect(jwtSignSpy).toHaveBeenCalledWith(
      { sub: "user1", email: "a@b.com", language: "en", providers: ["google"] },
      expect.any(String),
      { expiresIn: "1h" }
    );
    expect(result.accessToken).toBe("jwt-token");

    // Refresh token
    const hexString = Buffer.from("random-refresh-token").toString("hex");
    expect(bcryptHashSpy).toHaveBeenCalledWith(hexString, 10);
    expect(result.refreshToken).toBe(hexString);

    // DB storage
    expect(prismaCreateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          token: hexString,
          userId: "user1",
          expiresAt: expect.any(Date),
        }),
      })
    );

    // expiresIn
    expect(result.expiresIn).toBe(3600);

    // Restore spies
    randomBytesSpy.mockRestore();
    bcryptHashSpy.mockRestore();
    jwtSignSpy.mockRestore();
    prismaCreateSpy.mockRestore();
  });

  // ------ Test 5️⃣ ------
  it("revokes old refresh token if it matches a stored hashed token", async () => {
    const mockFindMany = jest.fn().mockResolvedValue([
      { id: "1", token: "hashed-old-token" },
      { id: "2", token: "hashed-other-token" },
    ]);
    const mockUpdate = jest.fn().mockResolvedValue({});
    const mockPrismaWithOldToken = {
      refreshToken: {
        create: jest.fn(),
        findMany: mockFindMany,
        update: mockUpdate,
      },
    };

    const mockBcryptWithCompare = {
      ...mockBcrypt,
      compare: jest.fn(async (plain: string, hashed: string) => {
        return plain === "old-refresh-token" && hashed === "hashed-old-token";
      }),
    };

    const opts: GenerateTokenOptions = {
      userId: "user-old",
      email: "old@token.com",
      prismaClient: mockPrismaWithOldToken as any,
      cryptoFn: mockCrypto as any,
      bcryptFn: mockBcryptWithCompare as any,
      jwtFn: mockJwt as any,
      oldRefreshToken: "old-refresh-token",
    };

    const result = await generateToken(opts);

    // Ensure revocation logic ran
    expect(mockFindMany).toHaveBeenCalledWith({
      where: { userId: "user-old", revoked: false },
    });
    expect(mockBcryptWithCompare.compare).toHaveBeenCalledWith(
      "old-refresh-token",
      "hashed-old-token"
    );
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "1" },
      data: { revoked: true },
    });

    // Ensure new refresh token was still created
    expect(mockPrismaWithOldToken.refreshToken.create).toHaveBeenCalled();

    // Ensure result still contains valid tokens
    expect(result).toHaveProperty("accessToken", "jwt-token");
    expect(result).toHaveProperty("refreshToken");
  });
});

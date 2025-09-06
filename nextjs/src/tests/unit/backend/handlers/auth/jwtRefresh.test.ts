import { refreshTokenHandler } from "@/lib/server/handlers/auth/jwtRefresh";
import { NextRequest } from "next/server";
import { mockPrisma } from "@/tests/jest.setup";
import bcrypt from "bcrypt";

jest.mock("bcrypt", () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe("refreshTokenHandler", () => {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  let mockBcrypt: any;
  let mockCrypto: any;
  let mockJwt: any;

  beforeEach(() => {
    jest.resetAllMocks();

    mockBcrypt = bcrypt;

    mockCrypto = {
      randomBytes: jest.fn(),
    };

    mockJwt = {
      sign: jest.fn(),
    };
  });

  beforeEach(() => {
    jest.resetAllMocks();

    mockBcrypt = {
      compare: jest.fn(),
      hash: jest.fn(),
    };

    mockCrypto = {
      randomBytes: jest.fn(),
    };

    mockJwt = {
      sign: jest.fn(),
    };
  });

  it("returns 400 if no refreshToken in body", async () => {
    const req = {
      json: async () => ({}),
    } as unknown as NextRequest;

    const res = await refreshTokenHandler(req, { prismaClient: mockPrisma, bcryptFn: mockBcrypt, cryptoFn: mockCrypto, jwtFn: mockJwt });
    expect((res as any).status).toBe(400);
  });

  it("returns 401 if refresh token not found or expired", async () => {
    mockPrisma.refreshToken.findFirst.mockResolvedValue(null);
    const req = { json: async () => ({ refreshToken: "abc" }) } as unknown as NextRequest;

    const res = await refreshTokenHandler(req, { prismaClient: mockPrisma, bcryptFn: mockBcrypt, cryptoFn: mockCrypto, jwtFn: mockJwt });
    expect((res as any).status).toBe(401);
  });

  it("returns 401 if refresh token invalid", async () => {
    const tokenRecord = { id: "1", token: "hashed", userId: "user1" };
    mockPrisma.refreshToken.findFirst.mockResolvedValue(tokenRecord);
    mockBcrypt.compare.mockResolvedValue(false);

    const req = { json: async () => ({ refreshToken: "wrong" }) } as unknown as NextRequest;

    const res = await refreshTokenHandler(req, { prismaClient: mockPrisma, bcryptFn: mockBcrypt, cryptoFn: mockCrypto, jwtFn: mockJwt });
    expect((res as any).status).toBe(401);
  });

  it("returns 404 if user not found", async () => {
    const tokenRecord = { id: "1", token: "hashed", userId: "user1" };
    mockPrisma.refreshToken.findFirst.mockResolvedValue(tokenRecord);
    mockBcrypt.compare.mockResolvedValue(true);
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const req = { json: async () => ({ refreshToken: "valid" }) } as unknown as NextRequest;

    const res = await refreshTokenHandler(req, { prismaClient: mockPrisma, bcryptFn: mockBcrypt, cryptoFn: mockCrypto, jwtFn: mockJwt });
    expect((res as any).status).toBe(404);
  });

  it("creates new tokens and deletes old token if valid", async () => {
    const tokenRecord = { id: "1", token: "hashed", userId: "user1" };
    const user = { id: "user1", email: "a@b.com" };
    const newAccessToken = "newAccess";
    const rawRefreshToken = "newRefresh"; // the raw string
    const newRefreshTokenHex = Buffer.from(rawRefreshToken, "utf-8").toString("hex"); // hex as handler does

    mockPrisma.refreshToken.findFirst.mockResolvedValue(tokenRecord);
    mockBcrypt.compare.mockResolvedValue(true);
    mockPrisma.user.findUnique.mockResolvedValue(user);
    mockCrypto.randomBytes.mockReturnValue(Buffer.from(rawRefreshToken, "utf-8")); // buffer
    mockBcrypt.hash.mockResolvedValue("hashedNewRefresh");
    mockJwt.sign.mockReturnValue(newAccessToken);

    const req = { json: async () => ({ refreshToken: "valid" }) } as unknown as NextRequest;

    const res: any = await refreshTokenHandler(req, {
      prismaClient: mockPrisma,
      bcryptFn: mockBcrypt,
      cryptoFn: mockCrypto,
      jwtFn: mockJwt,
    });

    const body = await res.json();
    expect(body.accessToken).toBe(newAccessToken);
    expect(body.refreshToken).toBe(newRefreshTokenHex); // expect hex string
    expect(mockPrisma.refreshToken.create).toHaveBeenCalled();
    expect(mockPrisma.refreshToken.delete).toHaveBeenCalledWith({ where: { id: tokenRecord.id } });
  });

  it("uses default dependencies if none provided", async () => {
    const tokenRecord = { id: "1", token: "refreshToken", userId: "user1" };
    const user = { id: "user1", email: "a@b.com" };

    // Mock prisma
    const prismaMock = {
      refreshToken: {
        findFirst: jest.fn().mockResolvedValue(tokenRecord),
        create: jest.fn(),
        delete: jest.fn(),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue(user),
      },
    };

    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const req = { json: async () => ({ refreshToken: "refreshToken" }) } as unknown as NextRequest;

    const res = await refreshTokenHandler(req, { prismaClient: prismaMock });

    const body = await res.json();
    expect(body.accessToken).toBeDefined();
    expect(body.refreshToken).toHaveLength(128);
    expect(prismaMock.refreshToken.create).toHaveBeenCalled();
    expect(prismaMock.refreshToken.delete).toHaveBeenCalledWith({ where: { id: tokenRecord.id } });
  });
});

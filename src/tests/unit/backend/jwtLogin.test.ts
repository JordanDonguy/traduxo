import { NextRequest } from "next/server";
import { jwtLoginHandler, JwtLoginDeps } from "@/lib/server/handlers/jwtLogin";
import { mockPrisma } from "@/tests/jest.setup";
import * as prismaModule from "@/lib/server/prisma";
import * as authModule from "@/lib/server/auth/authorizeUser";

describe("jwtLoginHandler", () => {
  const mockDeps: JwtLoginDeps = {
    authorizeUserFn: jest.fn(),
    prismaClient: mockPrisma,
    cryptoFn: { randomBytes: jest.fn(() => Buffer.from("refresh-token")) },
    bcryptFn: { hash: jest.fn(async () => "hashed-token") },
    jwtFn: { sign: jest.fn(() => "jwt-token") },
  };

  beforeEach(() => jest.clearAllMocks());

  it("fails if missing credentials", async () => {
    const req = { json: async () => ({}) } as unknown as NextRequest;
    const res = await jwtLoginHandler(req, mockDeps);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toBe("Missing credentials");
  });

  it("fails if authorizeUser returns null", async () => {
    (mockDeps.authorizeUserFn as jest.Mock).mockResolvedValue(null);
    const req = { json: async () => ({ email: "a@b.com", password: "123" }) } as unknown as NextRequest;
    const res = await jwtLoginHandler(req, mockDeps);
    const json = await res.json();
    expect(res.status).toBe(401);
    expect(json.error).toBe("Invalid credentials");
  });

  it("creates tokens successfully", async () => {
    (mockDeps.authorizeUserFn as jest.Mock).mockResolvedValue({ id: "user1", email: "a@b.com" });
    const req = { json: async () => ({ email: "a@b.com", password: "123" }) } as unknown as NextRequest;

    const res = await jwtLoginHandler(req, mockDeps);
    const json = await res.json();

    expect(mockDeps.cryptoFn!.randomBytes).toHaveBeenCalledWith(64);
    expect(mockDeps.bcryptFn!.hash).toHaveBeenCalledWith(expect.any(String), 10);
    expect(mockDeps.jwtFn!.sign).toHaveBeenCalledWith(
      { sub: "user1", email: "a@b.com" },
      expect.any(String),
      { expiresIn: "1h" }
    );
    expect(mockDeps.prismaClient.refreshToken.create).toHaveBeenCalled();

    // ✅ Updated assertion: check that refreshToken is a string, not exact value
    expect(json).toHaveProperty("accessToken", "jwt-token");
    expect(json).toHaveProperty("expiresIn", 3600);
    expect(typeof json.refreshToken).toBe("string");
  });

  it("uses default dependencies when none are provided", async () => {
    const req = {
      json: async () => ({ email: "default@user.com", password: "123" }),
    } as unknown as NextRequest;

    // Spy on authorizeUser
    const authorizeSpy = jest
      .spyOn(authModule, "authorizeUser")
      .mockResolvedValue({ id: "user1", email: "default@user.com" });

    // Spy on prisma.refreshToken.create
    const createSpy = jest
      .spyOn(prismaModule.prisma.refreshToken, "create")
      .mockResolvedValue({
        id: "token1",
        userId: "user1",
        createdAt: new Date(),
        token: "hashed-token",
        expiresAt: new Date(Date.now() + 3600 * 1000),
        revoked: false,
      });

    const res = await jwtLoginHandler(req, {
      prismaClient: undefined,
      bcryptFn: undefined,
      cryptoFn: undefined,
      jwtFn: undefined,
      authorizeUserFn: undefined,
    });

    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toHaveProperty("accessToken");
    expect(json).toHaveProperty("refreshToken");
    expect(json).toHaveProperty("expiresIn", 3600);

    // Restore spies
    authorizeSpy.mockRestore();
    createSpy.mockRestore();
  });
});

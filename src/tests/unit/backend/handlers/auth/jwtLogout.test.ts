import { NextRequest } from "next/server";
import { jwtLogoutHandler, JwtLogoutDeps } from "@/lib/server/handlers/auth/jwtLogout";
import { mockPrisma } from "@/tests/jest.setup";
import * as prismaModule from "@/lib/server/prisma";

describe("jwtLogoutHandler", () => {
  // Properly typed bcrypt mock
  const mockDeps: JwtLogoutDeps = {
    prismaClient: mockPrisma,
    bcryptFn: {
      compareSync: jest.fn(),
    },
  };

  beforeEach(() => jest.clearAllMocks());

  it("fails if missing refreshToken", async () => {
    const req = { json: async () => ({}) } as unknown as NextRequest;
    const res = await jwtLogoutHandler(req, mockDeps);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("Missing refresh token");
  });

  it("does nothing if token does not match any hashed token", async () => {
    mockDeps.prismaClient!.refreshToken.findMany.mockResolvedValue([
      { id: "1", token: "hashed1" },
      { id: "2", token: "hashed2" },
    ]);
    (mockDeps.bcryptFn!.compareSync as jest.Mock).mockReturnValue(false);

    const req = { json: async () => ({ refreshToken: "invalid-token" }) } as unknown as NextRequest;
    const res = await jwtLogoutHandler(req, mockDeps);
    const json = await res.json();

    expect(mockDeps.prismaClient!.refreshToken.delete).not.toHaveBeenCalled();
    expect(json).toEqual({ success: true, message: "Logged out" });
  });

  it("deletes token if it matches hashed token", async () => {
    const tokens = [{ id: "1", token: "hashed1" }];
    mockDeps.prismaClient!.refreshToken.findMany.mockResolvedValue(tokens);
    (mockDeps.bcryptFn!.compareSync as jest.Mock).mockImplementation(
      (plain: string, hashed: string) => plain === "refresh-token" && hashed === "hashed1"
    );

    const req = { json: async () => ({ refreshToken: "refresh-token" }) } as unknown as NextRequest;
    const res = await jwtLogoutHandler(req, mockDeps);
    const json = await res.json();

    expect(mockDeps.prismaClient!.refreshToken.delete).toHaveBeenCalledWith({ where: { id: "1" } });
    expect(json).toEqual({ success: true, message: "Logged out" });
  });

  it("handles errors gracefully", async () => {
    mockDeps.prismaClient!.refreshToken.findMany.mockRejectedValue(new Error("DB error"));

    const req = { json: async () => ({ refreshToken: "any" }) } as unknown as NextRequest;
    const res = await jwtLogoutHandler(req, mockDeps);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe("Internal server error");
  });

  it("uses default prisma and bcrypt when deps are not provided", async () => {
    const req = { json: async () => ({ refreshToken: "any-token" }) } as unknown as NextRequest;

    // spy only on prisma (safe)
    const findManySpy = jest
      .spyOn(prismaModule.prisma.refreshToken, "findMany")
      .mockResolvedValue([
        {
          id: "1",
          userId: "user1",
          createdAt: new Date(),
          token: "hashed1",
          expiresAt: new Date(Date.now() + 1000 * 60 * 60),
          revoked: false,
        },
      ]);

    // call handler with explicit undefined deps to hit defaults
    const res = await jwtLogoutHandler(req, { prismaClient: undefined, bcryptFn: undefined });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toHaveProperty("success", true);
    expect(json).toHaveProperty("message", "Logged out");

    findManySpy.mockRestore();
  });
});

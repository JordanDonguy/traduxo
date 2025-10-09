import { NextRequest } from "next/server";
import { jwtLogoutHandler, LogoutDeps } from "@/lib/server/handlers/auth/jwtLogout";
import { mockPrisma } from "@/tests/jest.setup";
import * as prismaModule from "@/lib/server/prisma";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// ---- Mocks ----
const mockDeps: LogoutDeps = {
  prismaClient: mockPrisma,
  bcryptFn: {
    compareSync: jest.fn(),
  } as Partial<typeof bcrypt> as typeof bcrypt,
  jwtFn: jwt,
};

// Fake access token that decodes to userId "user1"
const fakeAccessToken = jwt.sign({ sub: "user1" }, "test-secret");

// ---- Tests ----
describe("jwtLogoutHandler", () => {
  // ------ Test 1️⃣ ------
  it("fails if missing refreshToken or accessToken", async () => {
    const req = {
      headers: new Map([["x-client", "native"]]),
      json: async () => ({}),
    } as unknown as NextRequest;

    const res = await jwtLogoutHandler(req, mockDeps);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("Missing refreshToken or accessToken");
  });

  // ------ Test 2️⃣ ------
  it("does nothing if token does not match any hashed token (native)", async () => {
    mockDeps.prismaClient!.refreshToken.findMany.mockResolvedValue([
      { id: "1", token: "hashed1" },
    ]);
    (mockDeps.bcryptFn!.compareSync as jest.Mock).mockReturnValue(false);

    const req = {
      headers: new Map([["x-client", "native"]]),
      json: async () => ({ refreshToken: "invalid-token", accessToken: fakeAccessToken }),
    } as unknown as NextRequest;

    const res = await jwtLogoutHandler(req, mockDeps);
    const json = await res.json();

    expect(mockDeps.prismaClient!.refreshToken.update).not.toHaveBeenCalled();
    expect(json).toEqual({ success: true, message: "Logged out" });
  });

  // ------ Test 3️⃣ ------
  it("revokes token if it matches hashed token (native)", async () => {
    const tokens = [{ id: "1", token: "hashed1" }];
    mockDeps.prismaClient!.refreshToken.findMany.mockResolvedValue(tokens);
    (mockDeps.bcryptFn!.compareSync as jest.Mock).mockImplementation(
      (plain: string, hashed: string) => plain === "refresh-token" && hashed === "hashed1"
    );

    const req = {
      headers: new Map([["x-client", "native"]]),
      json: async () => ({ refreshToken: "refresh-token", accessToken: fakeAccessToken }),
    } as unknown as NextRequest;

    const res = await jwtLogoutHandler(req, mockDeps);
    const json = await res.json();

    expect(mockDeps.prismaClient!.refreshToken.update).toHaveBeenCalledWith({
      where: { id: "1" },
      data: { revoked: true },
    });
    expect(json).toEqual({ success: true, message: "Logged out" });
  });

  // ------ Test 4️⃣ ------
  it("handles errors gracefully", async () => {
    mockDeps.prismaClient!.refreshToken.findMany.mockRejectedValue(new Error("DB error"));

    const req = {
      headers: new Map([["x-client", "native"]]),
      json: async () => ({ refreshToken: "any", accessToken: fakeAccessToken }),
    } as unknown as NextRequest;

    const res = await jwtLogoutHandler(req, mockDeps);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe("Internal server error");
  });

  // ------ Test 5️⃣ ------
  it("uses default prisma and bcrypt when deps are not provided (web)", async () => {
    const req = {
      headers: new Map(), // no x-client header (web)
      cookies: {
        get: () => ({ value: "refresh-token" }), // simulate cookie
      },
      json: async () => ({ accessToken: fakeAccessToken }),
    } as unknown as NextRequest;

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

    const res = await jwtLogoutHandler(req, { prismaClient: undefined, bcryptFn: undefined });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toHaveProperty("success", true);
    expect(json).toHaveProperty("message", "Logged out");

    findManySpy.mockRestore();
  });

  // ------ Test 6️⃣ ------
  it("returns 401 if access token does not contain userId", async () => {
    // Fake jwt with no sub claim
    const badAccessToken = jwt.sign({ foo: "bar" }, "test-secret");

    // Override jwt.verify to throw (simulate invalid signature/expired token)
    const mockJwt = {
      ...jwt,
      verify: jest.fn(() => {
        throw new Error("invalid token");
      }),
      decode: jest.fn(() => ({ foo: "bar" })), // no sub property
    } as unknown as typeof jwt;

    const req = {
      headers: new Map([["x-client", "native"]]),
      json: async () => ({ refreshToken: "any", accessToken: badAccessToken }),
    } as unknown as NextRequest;

    const res = await jwtLogoutHandler(req, {
      ...mockDeps,
      jwtFn: mockJwt,
    });

    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe("Invalid access token");
  });

  // ------ Test 7️⃣ ------
  it("works for web clients using cookies", async () => {
    mockDeps.prismaClient!.refreshToken.findMany.mockResolvedValue([
      { id: "1", token: "hashed1" },
    ]);
    (mockDeps.bcryptFn!.compareSync as jest.Mock).mockReturnValue(true);

    const req = {
      headers: new Map(), // no x-client header → web
      cookies: {
        get: () => ({ value: "refresh-token" }),
      },
      json: async () => ({ accessToken: fakeAccessToken }),
    } as unknown as NextRequest;

    const res = await jwtLogoutHandler(req, mockDeps);
    const json = await res.json();

    expect(mockDeps.prismaClient!.refreshToken.update).toHaveBeenCalledWith({
      where: { id: "1" },
      data: { revoked: true },
    });
    expect(json).toEqual({ success: true, message: "Logged out" });
  });
});

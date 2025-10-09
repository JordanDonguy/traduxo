/* eslint-disable @typescript-eslint/no-explicit-any */
import { googleSignInHandler } from "@/lib/server/handlers/auth/googleLogin";
import { handleGoogleSignIn } from "@/lib/server/auth/handleGoogleSignIn";
import { generateToken } from "@/lib/server/auth/generateToken";

// ---- Mocks ----
jest.mock("@/lib/server/auth/handleGoogleSignIn");
jest.mock("@/lib/server/auth/generateToken");

const mockPrisma = { user: { findUnique: jest.fn(), update: jest.fn() } };

describe("googleSignInHandler", () => {
  // ------ Test 1️⃣ ------
  it("returns 400 if no code", async () => {
    const req = { json: async () => ({}) } as unknown as Request;
    const res = await googleSignInHandler(req as any, { prismaClient: mockPrisma, googleClient: {} as any });
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toBe("Missing authorization code");
  });

  // ------ Test 2️⃣ ------
  it("returns 400 if no id_token from Google", async () => {
    const req = { json: async () => ({ code: "abc" }), headers: new Headers() } as unknown as Request;

    const mockGoogleClient = {
      getToken: jest.fn().mockResolvedValue({ tokens: {} }),
      verifyIdToken: jest.fn(),
    } as unknown as any;

    const res = await googleSignInHandler(req as any, { prismaClient: mockPrisma, googleClient: mockGoogleClient });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("No id_token in Google response");
  });

  // ------ Test 3️⃣ ------
  it("returns 400 if Google token payload has no email", async () => {
    const req = { json: async () => ({ code: "abc" }), headers: new Headers() } as unknown as Request;

    const mockGoogleClient = {
      getToken: jest.fn().mockResolvedValue({ tokens: { id_token: "token" } }),
      verifyIdToken: jest.fn().mockResolvedValue({ getPayload: () => ({}) }),
    } as unknown as any;

    const res = await googleSignInHandler(req as any, { prismaClient: mockPrisma, googleClient: mockGoogleClient });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("Invalid Google token");
  });

  // ------ Test 4️⃣ ------
  it("returns 400 if handleGoogleSignIn says NeedGoogleLinking", async () => {
    const req = { json: async () => ({ code: "abc" }), headers: new Headers() } as unknown as Request;

    const mockGoogleClient = {
      getToken: jest.fn().mockResolvedValue({ tokens: { id_token: "token" } }),
      verifyIdToken: jest.fn().mockResolvedValue({ getPayload: () => ({ email: "user@example.com" }) }),
    } as unknown as any;

    (handleGoogleSignIn as jest.Mock).mockResolvedValue({ success: false, reason: "NeedGoogleLinking" });

    const res = await googleSignInHandler(req as any, { prismaClient: mockPrisma, googleClient: mockGoogleClient });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("NeedGoogleLinking");
  });

  // ------ Test 5️⃣ ------
  it("returns 500 if handleGoogleSignIn fails with unknown reason", async () => {
    const req = { json: async () => ({ code: "abc" }), headers: new Headers() } as unknown as Request;

    const mockGoogleClient = {
      getToken: jest.fn().mockResolvedValue({ tokens: { id_token: "token" } }),
      verifyIdToken: jest.fn().mockResolvedValue({ getPayload: () => ({ email: "user@example.com" }) }),
    } as unknown as any;

    (handleGoogleSignIn as jest.Mock).mockResolvedValue({ success: false, reason: "SomeOtherReason" });

    const res = await googleSignInHandler(req as any, { prismaClient: mockPrisma, googleClient: mockGoogleClient });
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json).toEqual({ success: false, reason: "SomeOtherReason" });
  });

  // ------ Test 6️⃣ ------
  it("returns JSON with token and refreshToken for native client", async () => {
    const req = {
      json: async () => ({ code: "abc" }),
      headers: new Headers({ "x-client": "native" }),
    } as unknown as Request;

    const mockGoogleClient = {
      getToken: jest.fn().mockResolvedValue({ tokens: { id_token: "token" } }),
      verifyIdToken: jest.fn().mockResolvedValue({
        getPayload: () => ({ email: "user@example.com" }),
      }),
    } as unknown as any;

    (handleGoogleSignIn as jest.Mock).mockResolvedValue({
      success: true,
      userId: "user1",
      language: "en",
      providers: ["Google"],
    });
    (generateToken as jest.Mock).mockResolvedValue({
      accessToken: "jwt-access",
      refreshToken: "jwt-refresh",
      expiresIn: 3600,
    });

    const res = await googleSignInHandler(req as any, { prismaClient: mockPrisma, googleClient: mockGoogleClient });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.token).toBe("jwt-access");
    expect(json.refreshToken).toBe("jwt-refresh");
  });

  // ------ Test 7️⃣ ------
  it("sets refresh token cookie for web clients", async () => {
    const req = {
      json: async () => ({ code: "abc" }),
      headers: new Headers(), // no x-client → web
    } as unknown as Request;

    const mockGoogleClient = {
      getToken: jest.fn().mockResolvedValue({ tokens: { id_token: "token" } }),
      verifyIdToken: jest.fn().mockResolvedValue({ getPayload: () => ({ email: "user@example.com" }) }),
    } as unknown as any;

    (handleGoogleSignIn as jest.Mock).mockResolvedValue({
      success: true,
      userId: "user123",
      language: "fr",
      providers: ["Google"],
    });

    (generateToken as jest.Mock).mockResolvedValue({
      accessToken: "jwt-access",
      refreshToken: "jwt-refresh",
      expiresIn: 3600,
    });

    const res = await googleSignInHandler(req as any, { prismaClient: mockPrisma, googleClient: mockGoogleClient });

    // JSON body
    const json = await res.json();
    expect(json.token).toBe("jwt-access");

    // Verify that cookie is set
    const cookies = res.cookies.get("refreshToken");
    expect(cookies?.value).toBe("jwt-refresh");
  });

  // ------ Test 8️⃣ ------
  it("returns 500 if unexpected error occurs", async () => {
    const req = { json: async () => ({ code: "abc" }), headers: new Headers() } as unknown as Request;

    const mockGoogleClient = {
      getToken: jest.fn().mockImplementation(() => { throw new Error("fail"); }),
      verifyIdToken: jest.fn(),
    } as unknown as any;

    const res = await googleSignInHandler(req as any, { prismaClient: mockPrisma, googleClient: mockGoogleClient });
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe("Internal server error");
  });
});

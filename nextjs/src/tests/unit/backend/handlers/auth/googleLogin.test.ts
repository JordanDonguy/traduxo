/* eslint-disable @typescript-eslint/no-explicit-any */
import { googleSignInHandler } from "@/lib/server/handlers/auth/googleLogin";
import { handleGoogleSignIn } from "@/lib/server/auth/handleGoogleSignIn";
import { generateToken } from "@/lib/server/auth/generateToken";

// ---- Mocks ----
jest.mock("@/lib/server/auth/handleGoogleSignIn");
jest.mock("@/lib/server/auth/generateToken");
const mockPrisma = { user: { findUnique: jest.fn(), update: jest.fn() } };

// ---- Tests ----
describe("googleSignInHandler", () => {
  // ------ Test 1️⃣ ------
  it("returns 400 if no code", async () => {
    const req = { json: async () => ({}) } as unknown as Request;
    const res = await googleSignInHandler(req, { prismaClient: mockPrisma, googleClient: {} as any });
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toBe("Missing authorization code");
  });

  // ------ Test 2️⃣ ------
  it("returns 400 if no id_token from Google", async () => {
    const req = { json: async () => ({ code: "abc" }) } as unknown as Request;

    const mockGoogleClient = {
      getToken: jest.fn().mockResolvedValue({ tokens: {} }), // no id_token
      verifyIdToken: jest.fn(),
    } as unknown as any;

    const res = await googleSignInHandler(req, { prismaClient: mockPrisma, googleClient: mockGoogleClient });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("No id_token in Google response");
  });

  // ------ Test 3️⃣ ------
  it("returns 400 if Google token payload has no email", async () => {
    const req = { json: async () => ({ code: "abc" }) } as unknown as Request;

    const mockGoogleClient = {
      getToken: jest.fn().mockResolvedValue({ tokens: { id_token: "token" } }),
      verifyIdToken: jest.fn().mockResolvedValue({ getPayload: () => ({}) }), // missing email
    } as unknown as any;

    const res = await googleSignInHandler(req, { prismaClient: mockPrisma, googleClient: mockGoogleClient });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("Invalid Google token");
  });

  // ------ Test 4️⃣ ------
  it("returns 400 if handleGoogleSignIn says NeedGoogleLinking", async () => {
    const req = { json: async () => ({ code: "abc" }) } as unknown as Request;

    const mockGoogleClient = {
      getToken: jest.fn().mockResolvedValue({ tokens: { id_token: "token" } }),
      verifyIdToken: jest.fn().mockResolvedValue({ getPayload: () => ({ email: "user@example.com" }) }),
    } as unknown as any;

    (handleGoogleSignIn as jest.Mock).mockResolvedValue({ success: false, reason: "NeedGoogleLinking" });

    const res = await googleSignInHandler(req, { prismaClient: mockPrisma, googleClient: mockGoogleClient });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("NeedGoogleLinking");
  });

  // ------ Test 5️⃣ ------
  it("returns 500 if handleGoogleSignIn fails with unknown reason", async () => {
    const req = { json: async () => ({ code: "abc" }) } as unknown as Request;

    const mockGoogleClient = {
      getToken: jest.fn().mockResolvedValue({ tokens: { id_token: "token" } }),
      verifyIdToken: jest.fn().mockResolvedValue({ getPayload: () => ({ email: "user@example.com" }) }),
    } as unknown as any;

    // Simulate handleGoogleSignIn failing for unknown reason
    (handleGoogleSignIn as jest.Mock).mockResolvedValue({ success: false, reason: "SomeOtherReason" });

    const res = await googleSignInHandler(req, { prismaClient: mockPrisma, googleClient: mockGoogleClient });
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json).toEqual({ success: false, reason: "SomeOtherReason" });
  });

  // ------ Test 6️⃣ ------
  it("success path returns tokens", async () => {
    const req = { json: async () => ({ code: "abc" }) } as unknown as Request;

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

    const res = await googleSignInHandler(req, { prismaClient: mockPrisma, googleClient: mockGoogleClient });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.accessToken).toBe("jwt-access");
    expect(json.refreshToken).toBe("jwt-refresh");
  });

  // ------ Test 7️⃣ ------
  it("uses fallback values for language and providers when undefined", async () => {
    const req = { json: async () => ({ code: "abc" }) } as unknown as Request;

    const mockGoogleClient = {
      getToken: jest.fn().mockResolvedValue({ tokens: { id_token: "token" } }),
      verifyIdToken: jest.fn().mockResolvedValue({ getPayload: () => ({ email: "user@example.com" }) }),
    } as unknown as any;

    // Return success but without language or providers
    (handleGoogleSignIn as jest.Mock).mockResolvedValue({
      success: true,
      userId: "user123",
    });

    (generateToken as jest.Mock).mockResolvedValue({
      accessToken: "jwt-access",
      refreshToken: "jwt-refresh",
      expiresIn: 3600,
    });

    const res = await googleSignInHandler(req, { prismaClient: mockPrisma, googleClient: mockGoogleClient });
    const json = await res.json();

    expect(generateToken).toHaveBeenCalledWith(
      expect.objectContaining({
        language: null,
        providers: ["Google"],
      })
    );

    expect(res.status).toBe(200);
    expect(json.accessToken).toBe("jwt-access");
  });

  // ------ Test 8️⃣ ------
  it("returns 500 if unexpected error occurs", async () => {
    const req = { json: async () => ({ code: "abc" }) } as unknown as Request;

    const mockGoogleClient = {
      getToken: jest.fn().mockImplementation(() => { throw new Error("fail"); }),
      verifyIdToken: jest.fn(),
    } as unknown as any;

    const res = await googleSignInHandler(req, { prismaClient: mockPrisma, googleClient: mockGoogleClient });
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe("Internal server error");
  });
});

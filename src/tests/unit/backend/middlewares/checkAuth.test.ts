import { checkAuth } from "@/lib/server/middlewares/checkAuth";
import { prisma } from "@/lib/server/prisma";
import { jwtVerify } from "jose";
import { validateJWTPayload } from "@/lib/server/middlewares/utils/validateJwtPayload";
import { createMockRequest } from "../mocks/requestMocks";

// ---- Mocks ----
jest.mock("@/lib/server/prisma");
jest.mock("next-auth");
jest.mock("jose", () => ({ jwtVerify: jest.fn() }));
jest.mock("@/lib/server/middlewares/utils/validateJwtPayload", () => ({
  validateJWTPayload: jest.fn(),
}));
const mockGetSession = jest.fn();

describe("checkAuth middleware", () => {

  // ------ NextAuth branch ------
  it("returns user from NextAuth session", async () => {
    mockGetSession.mockResolvedValue({ user: { email: "user@example.com" } });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: "user1", email: "user@example.com" });

    const req = createMockRequest({});
    const result = await checkAuth(req, { getSessionFn: mockGetSession });

    expect(mockGetSession).toHaveBeenCalled();
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "user@example.com" },
      select: { id: true, email: true },
    });
    expect(result).toEqual({ user: { id: "user1", email: "user@example.com" } });
  });

  it("returns null if NextAuth session exists but user not found", async () => {
    mockGetSession.mockResolvedValue({ user: { email: "user@example.com" } });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    const req = createMockRequest({});
    expect(await checkAuth(req, { getSessionFn: mockGetSession })).toBeNull();
  });

  // ------ JWT branch ------
  it("returns user from valid JWT token", async () => {
    mockGetSession.mockResolvedValue(null);
    const fakePayload = { sub: "user2", email: "jwt@example.com" };
    (jwtVerify as jest.Mock).mockResolvedValue({ payload: fakePayload });
    (validateJWTPayload as jest.Mock).mockImplementation(payload =>
      payload.sub && payload.email ? { id: payload.sub, email: payload.email } : null
    );

    const req = createMockRequest({}, { authorization: "Bearer valid.token.here" });
    const result = await checkAuth(req, { getSessionFn: mockGetSession });

    expect(jwtVerify).toHaveBeenCalled();
    expect(validateJWTPayload).toHaveBeenCalled();
    expect(result).toEqual({ user: { id: "user2", email: "jwt@example.com" } });
  });

  it("returns null if JWT is missing, malformed, payload invalid, or validateJWTPayload fails", async () => {
    mockGetSession.mockResolvedValue(null);

    // No Authorization header
    expect(await checkAuth(createMockRequest({}), { getSessionFn: mockGetSession })).toBeNull();

    // Malformed token
    expect(await checkAuth(createMockRequest({},
      { authorization: "Invalid token" }),
      { getSessionFn: mockGetSession }
    )).toBeNull();

    // jwtVerify returns undefined payload
    (jwtVerify as jest.Mock).mockResolvedValue({ payload: undefined });
    expect(await checkAuth(createMockRequest({},
      { authorization: "Bearer token" }),
      { getSessionFn: mockGetSession }
    )).toBeNull();

    // payload missing sub or email
    (jwtVerify as jest.Mock).mockResolvedValue({ payload: { sub: "123" } });
    (validateJWTPayload as jest.Mock).mockReturnValue(null);
    expect(await checkAuth(createMockRequest({},
      { authorization: "Bearer token" }),
      { getSessionFn: mockGetSession }
    )).toBeNull();
  });

  // ------ Error handling ------
  it("returns null on unexpected errors", async () => {
    mockGetSession.mockRejectedValue(new Error("oops"));
    const req = createMockRequest({});
    expect(await checkAuth(req, { getSessionFn: mockGetSession })).toBeNull();
  });
});

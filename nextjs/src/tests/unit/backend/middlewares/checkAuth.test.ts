import { checkAuth } from "@/lib/server/middlewares/checkAuth";
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
  // ------ Test 1️⃣ ------
  it("returns user from valid JWT token", async () => {
    mockGetSession.mockResolvedValue(null);
    const fakePayload = { sub: "user2", email: "jwt@example.com" };
    (jwtVerify as jest.Mock).mockResolvedValue({ payload: fakePayload });
    (validateJWTPayload as jest.Mock).mockImplementation(payload =>
      payload.sub && payload.email ? { id: payload.sub, email: payload.email } : null
    );

    const req = createMockRequest({}, { authorization: "Bearer valid.token.here" });
    const result = await checkAuth(req);

    expect(jwtVerify).toHaveBeenCalled();
    expect(validateJWTPayload).toHaveBeenCalled();
    expect(result).toEqual({ user: { id: "user2", email: "jwt@example.com" } });
  });

  // ------ Test 2️⃣ ------
  it("returns null if JWT is missing, malformed, payload invalid, or validateJWTPayload fails", async () => {
    mockGetSession.mockResolvedValue(null);

    // No Authorization header
    expect(await checkAuth(createMockRequest({}))).toBeNull();

    // Malformed token
    expect(await checkAuth(createMockRequest({},
      { authorization: "Invalid token" })
    )).toBeNull();

    // jwtVerify returns undefined payload
    (jwtVerify as jest.Mock).mockResolvedValue({ payload: undefined });
    expect(await checkAuth(createMockRequest({},
      { authorization: "Bearer token" })
    )).toBeNull();

    // payload missing sub or email
    (jwtVerify as jest.Mock).mockResolvedValue({ payload: { sub: "123" } });
    (validateJWTPayload as jest.Mock).mockReturnValue(null);
    expect(await checkAuth(createMockRequest({},
      { authorization: "Bearer token" })
    )).toBeNull();
  });

  // ------ Test 3️⃣ ------
  it("returns null on unexpected errors", async () => {
    mockGetSession.mockRejectedValue(new Error("oops"));
    const req = createMockRequest({});
    expect(await checkAuth(req)).toBeNull();
  });
});

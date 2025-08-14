jest.mock("@/lib/server/prisma");

import { mockPrisma } from "@/tests/jest.setup";
import { updateLanguage } from "@/lib/server/handlers/updateLanguage";

const mockGetSession = jest.fn();

function createMockRequest(body: unknown) {
  return {
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Request;
}

describe("updateLanguage", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default session returns valid user email
    mockGetSession.mockResolvedValue({ user: { email: "user@example.com" } });

    // Default user exists
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 1,
    });

    // Default prisma update mock
    mockPrisma.user.update.mockResolvedValue({});
  });

  // 1️⃣ Unauthorized if no session
  it("returns 401 if session is missing or email not present", async () => {
    mockGetSession.mockResolvedValue(null);

    const req = createMockRequest({ code: "en" });

    const response = await updateLanguage(req, {
      getSessionFn: mockGetSession,
      prismaClient: mockPrisma,
    });

    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.error).toBe("Unauthorized");
  });

  // 2️⃣ Validation fails
  it("returns 400 if validation fails (invalid code)", async () => {
    const req = createMockRequest({ code: "english" }); // invalid: too long

    const response = await updateLanguage(req, {
      getSessionFn: mockGetSession,
      prismaClient: mockPrisma,
    });

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBeDefined();
  });

  // 3️⃣ User not found
  it("returns 404 if user is not found", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const req = createMockRequest({ code: "en" });

    const response = await updateLanguage(req, {
      getSessionFn: mockGetSession,
      prismaClient: mockPrisma,
    });

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "user@example.com" },
      select: { id: true },
    });

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json.error).toBe("User not found");
  });

  // 4️⃣ Updates systemLang successfully
  it("updates systemLang and returns success", async () => {
    const req = createMockRequest({ code: "en" });

    const response = await updateLanguage(req, {
      getSessionFn: mockGetSession,
      prismaClient: mockPrisma,
    });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);

    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { systemLang: "en" },
    });
  });

  // 5️⃣ Handles unexpected errors
  it("returns 500 on unexpected errors", async () => {
    mockGetSession.mockImplementation(() => {
      throw new Error("Unexpected error");
    });

    const req = createMockRequest({ code: "en" });

    const response = await updateLanguage(req, {
      getSessionFn: mockGetSession,
      prismaClient: mockPrisma,
    });

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toBe("Internal Server Error");
  });
});

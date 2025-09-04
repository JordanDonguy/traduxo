jest.mock("@/lib/server/prisma");

import { mockPrisma } from "@/tests/jest.setup";
import { updateLanguage } from "@/lib/server/handlers/auth/updateLanguage";
import { createMockRequest } from "../../mocks/requestMocks";
import { checkAuth } from "@/lib/server/middlewares/checkAuth";

jest.mock('@/lib/server/middlewares/checkAuth');

describe("updateLanguage", () => {
  beforeEach(() => {
    // Default user exists
    mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });

    // Default prisma update mock
    mockPrisma.user.update.mockResolvedValue({});

    // Default checkAuth mock
    (checkAuth as jest.Mock).mockResolvedValue({ user: { id: "1", email: "user@example.com" } });
  });

  // ------ Test 1️⃣ ------
  it("returns 401 if x-user-email header is missing", async () => {
    (checkAuth as jest.Mock).mockResolvedValue(null);
    const req = createMockRequest({ code: "en" });

    const res = await updateLanguage(req, { prismaClient: mockPrisma });

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  // ------ Test 2️⃣ ------
  it("returns 400 if validation fails (invalid code)", async () => {
    const req = createMockRequest({ code: "english" });

    const res = await updateLanguage(req, { prismaClient: mockPrisma });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  // ------ Test 3️⃣ ------
  it("returns 404 if user is not found", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const req = createMockRequest({ code: "en" });

    const res = await updateLanguage(req, { prismaClient: mockPrisma });

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "user@example.com" },
      select: { id: true },
    });

    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("User not found");
  });

  // ------ Test 4️⃣ ------
  it("updates systemLang and returns success", async () => {
    const req = createMockRequest({ code: "en" });

    const res = await updateLanguage(req, { prismaClient: mockPrisma });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);

    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { systemLang: "en" },
    });
  });

  // ------ Test 5️⃣ ------
  it("returns 500 on unexpected errors", async () => {
    mockPrisma.user.findUnique.mockImplementation(() => {
      throw new Error("Unexpected error");
    });

    const req = createMockRequest({ code: "en" });

    const res = await updateLanguage(req, { prismaClient: mockPrisma });

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Internal Server Error");
  });
});

jest.mock("@/lib/server/prisma");
import { mockPrisma } from "@/tests/jest.setup";
import { updatePassword } from "@/lib/server/handlers/auth/updatePassword";
import bcrypt from "bcrypt";
import { createMockRequest } from "../../mocks/requestMocks";
import { checkAuth } from "@/lib/server/middlewares/checkAuth";

jest.mock("bcrypt");
jest.mock('@/lib/server/middlewares/checkAuth');

describe("updatePassword", () => {
  beforeEach(() => {
    // Default user exists with hashed password
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 1,
      password: "hashedOldPassword",
    });

    // Default bcrypt mocks
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    (bcrypt.hash as jest.Mock).mockResolvedValue("hashedNewPassword");

    // Default prisma update mock
    mockPrisma.user.update.mockResolvedValue({});

    // Default checkAuth mock
    (checkAuth as jest.Mock).mockResolvedValue({ user: { id: "1", email: "user@example.com" } });
  });

  // ------ Test 1️⃣ ------
  it("returns 401 if x-user-email header is missing", async () => {
    (checkAuth as jest.Mock).mockResolvedValue(null);
    const req = createMockRequest({ currentPassword: "oldpass", password: "newpass123" }, {});

    const res = await updatePassword(req, { prismaClient: mockPrisma });

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  // ------ Test 2️⃣ ------
  it("returns 400 if validation fails (missing fields or wrong types)", async () => {
    const req = createMockRequest({ currentPassword: 1234, password: true });

    const res = await updatePassword(req, { prismaClient: mockPrisma });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  // ------ Test 3️⃣ ------
  it("returns 400 if password is too short", async () => {
    const req = createMockRequest({ currentPassword: "oldpass123", password: "short" });

    const res = await updatePassword(req, { prismaClient: mockPrisma });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.toLowerCase()).toContain("password");
  });

  // ------ Test 4️⃣ ------
  it("returns 404 if user is not found", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const req = createMockRequest({ currentPassword: "oldpass123", password: "newpass123" });

    const res = await updatePassword(req, { prismaClient: mockPrisma });

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "user@example.com" },
      select: { id: true, password: true },
    });

    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("User not found");
  });

  // ------ Test 5️⃣ ------
  it("returns 400 if user has no password set", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 1, password: null });

    const req = createMockRequest({ currentPassword: "oldpass123", password: "newpass123" });

    const res = await updatePassword(req, { prismaClient: mockPrisma });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("No password set for user");
  });

  // ------ Test 6️⃣ ------
  it("returns 400 if currentPassword is missing", async () => {
    const req = createMockRequest({ password: "newpass123" });

    const res = await updatePassword(req, { prismaClient: mockPrisma });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  // ------ Test 7️⃣ ------
  it("returns 403 if current password does not match", async () => {
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const req = createMockRequest({ currentPassword: "wrongOldPass", password: "newpass123" });

    const res = await updatePassword(req, { prismaClient: mockPrisma });

    expect(bcrypt.compare).toHaveBeenCalledWith(
      "wrongOldPass",
      "hashedOldPassword"
    );
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("Current password is incorrect");
  });

  // ------ Test 8️⃣ ------
  it("hashes new password, updates user, and returns success", async () => {
    const req = createMockRequest({ currentPassword: "oldpass123", password: "newpass123" });

    const res = await updatePassword(req, { prismaClient: mockPrisma });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);

    expect(bcrypt.compare).toHaveBeenCalledWith(
      "oldpass123",
      "hashedOldPassword"
    );
    expect(bcrypt.hash).toHaveBeenCalledWith("newpass123", 10);
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { password: "hashedNewPassword" },
    });
  });

  // ------ Test 9️⃣ ------
  it("returns 500 on unexpected errors", async () => {
    // Make prisma throw an unexpected error AFTER validation
    mockPrisma.user.findUnique.mockImplementation(() => {
      throw new Error("Unexpected error");
    });

    const req = createMockRequest({ currentPassword: "oldpass123", password: "newpass123" });

    const res = await updatePassword(req, { prismaClient: mockPrisma });

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Internal Server Error");
  });
});

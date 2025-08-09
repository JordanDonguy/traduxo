jest.mock("@/lib/server/prisma");

import { mockPrisma } from "@/tests/jest.setup";
import { updatePassword } from "@/lib/server/handlers/updatePassword";
import bcrypt from "bcrypt";

jest.mock("bcrypt");

const mockGetSession = jest.fn();

function createMockRequest(body: unknown) {
  return {
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Request;
}

describe("updatePassword", () => {
  // ------ Reset mocks before each tests and set default mocks ------
  beforeEach(() => {
    jest.clearAllMocks();

    // Default session returns valid user email
    mockGetSession.mockResolvedValue({ user: { email: "user@example.com" } });

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
  });

  // ------ Test 1️⃣ ------
  it("returns 401 if session is missing or email not present", async () => {
    mockGetSession.mockResolvedValue(null);

    const req = createMockRequest({
      currentPassword: "oldpass",
      password: "newpass123",
    });

    const response = await updatePassword(req, {
      getSessionFn: mockGetSession,
      prismaClient: mockPrisma,
    });

    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.error).toBe("Unauthorized");
  });

  // ------ Test 2️⃣ ------
  it("returns 400 if validation fails (missing fields or wrong types)", async () => {
    const req = createMockRequest({ currentPassword: 1234, password: true }); // invalid types

    const response = await updatePassword(req, {
      getSessionFn: mockGetSession,
      prismaClient: mockPrisma,
    });

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBeDefined();
  });

  // ------ Test 3️⃣ ------
  it("returns 400 if password is too short", async () => {
    const req = createMockRequest({
      currentPassword: "oldpass123",
      password: "short",
    });

    const response = await updatePassword(req, {
      getSessionFn: mockGetSession,
      prismaClient: mockPrisma,
    });

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error.toLowerCase()).toContain("password");
  });

  // ------ Test 4️⃣ ------
  it("returns 404 if user is not found", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const req = createMockRequest({
      currentPassword: "oldpass123",
      password: "newpass123",
    });

    const response = await updatePassword(req, {
      getSessionFn: mockGetSession,
      prismaClient: mockPrisma,
    });

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "user@example.com" },
      select: { id: true, password: true },
    });

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json.error).toBe("User not found");
  });

  // ------ Test 5️⃣ ------
  it("returns 400 if user has no password set", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: 1, password: null });

    const req = createMockRequest({
      currentPassword: "oldpass123",
      password: "newpass123",
    });

    const response = await updatePassword(req, {
      getSessionFn: mockGetSession,
      prismaClient: mockPrisma,
    });

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe("No password set for user");
  });

  // ------ Test 6️⃣ ------
  it("returns 400 if currentPassword is missing", async () => {
    const req = createMockRequest({
      password: "newpass123",
    });

    const response = await updatePassword(req, {
      getSessionFn: mockGetSession,
      prismaClient: mockPrisma,
    });

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBeDefined();
  });

  // ------ Test 7️⃣ ------
  it("returns 403 if current password does not match", async () => {
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const req = createMockRequest({
      currentPassword: "wrongOldPass",
      password: "newpass123",
    });

    const response = await updatePassword(req, {
      getSessionFn: mockGetSession,
      prismaClient: mockPrisma,
    });

    expect(bcrypt.compare).toHaveBeenCalledWith(
      "wrongOldPass",
      "hashedOldPassword"
    );
    expect(response.status).toBe(403);
    const json = await response.json();
    expect(json.error).toBe("Current password is incorrect");
  });

  // ------ Test 8️⃣ ------
  it("hashes new password, updates user, and returns success", async () => {
    const req = createMockRequest({
      currentPassword: "oldpass123",
      password: "newpass123",
    });

    const response = await updatePassword(req, {
      getSessionFn: mockGetSession,
      prismaClient: mockPrisma,
    });

    expect(response.status).toBe(200);
    const json = await response.json();
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
    mockGetSession.mockImplementation(() => {
      throw new Error("Unexpected error");
    });

    const req = createMockRequest({
      currentPassword: "oldpass",
      password: "newpass123",
    });

    const response = await updatePassword(req, {
      getSessionFn: mockGetSession,
      prismaClient: mockPrisma,
    });

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toBe("Internal Server Error");
  });
});

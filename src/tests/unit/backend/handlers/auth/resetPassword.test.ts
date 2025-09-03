import { resetPassword } from "@/lib/server/handlers/auth/resetPassword";
import bcrypt from "bcrypt";
import { mockPrisma } from "@/tests/jest.setup";

jest.mock("bcrypt");

function createMockRequest(body: unknown) {
  return {
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Request;
}

describe("resetPassword", () => {
  // ------ Test 1️⃣ ------
  it("returns 400 if password or token is missing", async () => {
    const req = createMockRequest({});
    const response = await resetPassword(req, { prismaClient: mockPrisma });
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBeDefined();
  });

  // ------ Test 2️⃣ ------
  it("returns 400 if token is invalid", async () => {
    const req = createMockRequest({ password: "test1234", token: "this-is-an-invalid-token-12345678" });
    mockPrisma.passwordReset.findUnique.mockResolvedValue(null);

    const response = await resetPassword(req, { prismaClient: mockPrisma });
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe("Invalid or expired token");
  });

  // ------ Test 3️⃣ ------
  it("returns 400 if token has expired", async () => {
    const req = createMockRequest({ password: "test1234", token: "this-is-an-expired-token-12345678" });
    mockPrisma.passwordReset.findUnique.mockResolvedValue({
      id: "reset-id",
      userId: "user-id",
      expiresAt: new Date(Date.now() - 1000), // already expired
    });

    const response = await resetPassword(req, { prismaClient: mockPrisma });
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe("Token has expired");
  });

  // ------ Test 4️⃣ ------
  it("hashes password, updates user, deletes token and returns success", async () => {
    const req = createMockRequest({ password: "newpass123", token: "this-is-a-valid-token-1234567890" });
    mockPrisma.passwordReset.findUnique.mockResolvedValue({
      id: "reset-id",
      userId: "user-id",
      expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 hour ahead
    });
    (bcrypt.hash as jest.Mock).mockResolvedValue("hashedPassword");
    mockPrisma.user.update.mockResolvedValue({});
    mockPrisma.passwordReset.delete.mockResolvedValue({});

    const response = await resetPassword(req, { prismaClient: mockPrisma });

    expect(bcrypt.hash).toHaveBeenCalledWith("newpass123", 10);
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-id" },
      data: { password: "hashedPassword" },
    });
    expect(mockPrisma.passwordReset.delete).toHaveBeenCalledWith({
      where: { id: "reset-id" },
    });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
  });

  // ------ Test 5️⃣ ------
  it("returns 400 if Zod validation fails", async () => {
    const req = createMockRequest({ password: 1234, token: true }); // invalid types

    const response = await resetPassword(req, { prismaClient: mockPrisma });
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBeDefined();
  });

  // ------ Test 6️⃣ ------
  it("returns 500 on unexpected errors", async () => {
    const req = createMockRequest({ password: "test1234", token: "this-is-a-valid-token-1234567890" });
    mockPrisma.passwordReset.findUnique.mockImplementation(() => {
      throw new Error("Unexpected error");
    });

    const response = await resetPassword(req, { prismaClient: mockPrisma });
    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toBe("Internal Server Error");
  });
});

import { deleteAccount } from "@/lib/server/handlers/auth/deleteAccount";
import { mockPrisma } from "@/tests/jest.setup";
import { createMockRequest } from "../../mocks/requestMocks";
import { checkAuth } from "@/lib/server/middlewares/checkAuth";

jest.mock('@/lib/server/middlewares/checkAuth');

describe("deleteAccount", () => {
  beforeEach(() => {
    (checkAuth as jest.Mock).mockResolvedValue({ user: { id: "1", email: "user@example.com" } });
  });

  // ------ Test 1️⃣ ------
  it("returns 401 if user not authenticated", async () => {
    (checkAuth as jest.Mock).mockResolvedValue(null);
    const req = createMockRequest(null);
    const res = await deleteAccount(req, { prismaClient: mockPrisma });
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
  });

  // ------ Test 2️⃣ ------
  it("returns 404 if user not found", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const req = createMockRequest(null);
    const res = await deleteAccount(req, { prismaClient: mockPrisma });
    const json = await res.json();

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "user@example.com" },
      select: { id: true },
    });
    expect(res.status).toBe(404);
    expect(json.error).toBe("User not found");
  });

  // ------ Test 3️⃣ ------
  it("deletes the user and returns 200 on success", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: "1" });
    mockPrisma.user.delete.mockResolvedValue({});

    const req = createMockRequest(null);
    const res = await deleteAccount(req, { prismaClient: mockPrisma });
    const json = await res.json();

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "user@example.com" },
      select: { id: true },
    });
    expect(mockPrisma.user.delete).toHaveBeenCalledWith({ where: { id: "1" } });
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.message).toBe("Account deleted successfully");
  });

  // ------ Test 4️⃣ ------
  it("returns 400 if prisma.delete throws an Error", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: "1" });
    mockPrisma.user.delete.mockRejectedValue(new Error("DB error"));

    const req = createMockRequest(null);
    const res = await deleteAccount(req, { prismaClient: mockPrisma });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("DB error");
  });

  // ------ Test 5️⃣ ------
  it("returns 400 if prisma.delete throws unexpected non-Error", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: "1" });
    mockPrisma.user.delete.mockImplementation(() => { throw "unknown error string"; });

    const req = createMockRequest(null);
    const res = await deleteAccount(req, { prismaClient: mockPrisma });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.message).toBe("Invalid request");
    expect(typeof json.error).toBe("string");
    expect(json.error).toBe("unknown error string");
  });
});

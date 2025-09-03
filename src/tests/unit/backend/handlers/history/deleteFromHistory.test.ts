import { deleteFromHistory } from "@/lib/server/handlers/history/deleteFromHistory";
import { mockPrisma } from "@/tests/jest.setup";
import { createMockRequest } from "../../mocks/requestMocks";
import { checkAuth } from "@/lib/server/middlewares/checkAuth";

jest.mock('@/lib/server/middlewares/checkAuth');

describe("deleteFromHistory handler", () => {
  beforeEach(() => {
    (checkAuth as jest.Mock).mockResolvedValue({ user: { id: "1", email: "user@example.com" } });
  });

  // ------ Test 1️⃣ ------
  it("returns 401 if not logged in", async () => {
    (checkAuth as jest.Mock).mockResolvedValue(null);
    const req = createMockRequest({ id: "some-id" });

    const res = await deleteFromHistory(req, { prismaClient: mockPrisma });

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  // ------ Test 2️⃣ ------
  it("should reject if id is missing or invalid", async () => {
    // missing id
    const req1 = createMockRequest({});

    const res1 = await deleteFromHistory(req1, { prismaClient: mockPrisma });
    expect(res1.status).toBe(400);
    const json1 = await res1.json();
    expect(json1.error).toMatch(/Invalid or missing translation id/);

    // invalid id type
    const req2 = createMockRequest({ id: 123 });

    const res2 = await deleteFromHistory(req2, { prismaClient: mockPrisma });
    expect(res2.status).toBe(400);
  });

  // ------ Test 3️⃣ ------
  it("should return 404 if translation not found", async () => {
    mockPrisma.history.findUnique.mockResolvedValue(null);

    const req = createMockRequest({ id: "trans1" });

    const res = await deleteFromHistory(req, { prismaClient: mockPrisma });

    expect(mockPrisma.history.findUnique).toHaveBeenCalledWith({ where: { id: "trans1" } });
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Translation not found or unauthorized");
  });

  // ------ Test 4️⃣ ------
  it("should return 404 if translation belongs to another user", async () => {
    mockPrisma.history.findUnique.mockResolvedValue({
      id: "trans1",
      userId: "user2", // different user
    });

    const req = createMockRequest({ id: "trans1" });

    const res = await deleteFromHistory(req, { prismaClient: mockPrisma });

    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Translation not found or unauthorized");
  });

  // ------ Test 5️⃣ ------
  it("should delete translation and return success", async () => {
    mockPrisma.history.findUnique.mockResolvedValue({
      id: "trans1",
      userId: "1",
    });

    mockPrisma.history.delete.mockResolvedValue({ id: "trans1" });

    const req = createMockRequest({ id: "trans1" });

    const res = await deleteFromHistory(req, { prismaClient: mockPrisma });

    expect(mockPrisma.history.delete).toHaveBeenCalledWith({ where: { id: "trans1" } });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  // ------ Test 6️⃣ ------
  it("should return 500 on unexpected errors", async () => {
    mockPrisma.history.findUnique.mockRejectedValue(new Error("Unexpected error"));

    const req = createMockRequest({ id: "trans1" });

    const res = await deleteFromHistory(req, { prismaClient: mockPrisma });

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Internal server error");
  });
});

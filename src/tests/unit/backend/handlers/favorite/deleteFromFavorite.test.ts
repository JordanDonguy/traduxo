import { deleteFromFavorite } from "@/lib/server/handlers/favorite/deleteFromFavorite";
import { mockPrisma } from "@/tests/jest.setup";
import { createMockRequest } from "../../mocks/requestMocks";
import { checkAuth } from "@/lib/server/middlewares/checkAuth";

jest.mock('@/lib/server/middlewares/checkAuth');

describe("deleteFromFavorite handler", () => {
  beforeEach(() => {
    (checkAuth as jest.Mock).mockResolvedValue({ user: { id: "1", email: "user@example.com" } });
  });

  // ------ Test 1️⃣ ------
  it("returns 401 if not logged in", async () => {
    (checkAuth as jest.Mock).mockResolvedValue(null);
    const req = createMockRequest({ id: "some-id" });

    const res = await deleteFromFavorite(req, {
      prismaClient: mockPrisma,
    });

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  // ------ Test 2️⃣ ------
  it("should reject if id is missing or invalid", async () => {
    // missing id
    const req1 = createMockRequest({});

    const res1 = await deleteFromFavorite(req1, {
      prismaClient: mockPrisma,
    });
    expect(res1.status).toBe(400);
    const json1 = await res1.json();
    expect(json1.error).toMatch(/Invalid or missing favorite id/);

    // invalid id type
    const req2 = createMockRequest(
      { id: 123 },
      { "x-user-id": "1", "x-user-email": "user@test.com" }
    );
    const res2 = await deleteFromFavorite(req2, {
      prismaClient: mockPrisma,
    });
    expect(res2.status).toBe(400);
  });

  // ------ Test 3️⃣ ------
  it("should return 404 if favorite not found", async () => {
    mockPrisma.favorite.findUnique.mockResolvedValue(null); // not found

    const req = createMockRequest({ id: "fav1" });

    const res = await deleteFromFavorite(req, {
      prismaClient: mockPrisma,
    });

    expect(mockPrisma.favorite.findUnique).toHaveBeenCalledWith({
      where: { id: "fav1" },
    });
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Favorite not found or unauthorized");
  });

  // ------ Test 4️⃣ ------
  it("should return 404 if favorite belongs to another user", async () => {
    mockPrisma.favorite.findUnique.mockResolvedValue({
      id: "fav1",
      userId: "user2", // not the same as header
    });

    const req = createMockRequest({ id: "fav1" });

    const res = await deleteFromFavorite(req, {
      prismaClient: mockPrisma,
    });

    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Favorite not found or unauthorized");
  });

  // ------ Test 5️⃣ ------
  it("should delete favorite and return success", async () => {
    mockPrisma.favorite.findUnique.mockResolvedValue({
      id: "fav1",
      userId: "1",
    });

    mockPrisma.favorite.delete.mockResolvedValue({ id: "fav1" });

    const req = createMockRequest({ id: "fav1" });

    const res = await deleteFromFavorite(req, {
      prismaClient: mockPrisma,
    });

    expect(mockPrisma.favorite.delete).toHaveBeenCalledWith({
      where: { id: "fav1" },
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  // ------ Test 6️⃣ ------
  it("should return 500 on unexpected errors", async () => {
    mockPrisma.favorite.findUnique.mockRejectedValue(
      new Error("Unexpected error")
    );

    const req = createMockRequest({ id: "fav1" });

    const res = await deleteFromFavorite(req, {
      prismaClient: mockPrisma,
    });

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Internal server error");
  });
});

import { deleteFromFavorite } from "@/lib/server/handlers/deleteFromFavorite";
import { mockPrisma } from "@/tests/jest.setup";

const mockGetSessionFn = jest.fn();

// Helper to create mock Request with JSON body
function createRequestWithBody(body: unknown) {
  return {
    json: () => Promise.resolve(body),
  } as Request;
}

describe("deleteFromFavorite handler", () => {
  // ------ Test 1️⃣ ------
  it("should reject unauthorized users", async () => {
    mockGetSessionFn.mockResolvedValue(null);

    const req = createRequestWithBody({ id: "some-id" });

    const res = await deleteFromFavorite(req, {
      getSessionFn: mockGetSessionFn,
      prismaClient: mockPrisma,
    });

    expect(mockGetSessionFn).toHaveBeenCalled();
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  // ------ Test 2️⃣ ------
  it("should reject if id is missing or invalid", async () => {
    mockGetSessionFn.mockResolvedValue({ user: { email: "user@test.com", id: "user1" } });

    // missing id
    const req1 = createRequestWithBody({});
    const res1 = await deleteFromFavorite(req1, {
      getSessionFn: mockGetSessionFn,
      prismaClient: mockPrisma,
    });
    expect(res1.status).toBe(400);
    const json1 = await res1.json();
    expect(json1.error).toMatch(/Invalid or missing favorite id/);

    // invalid id type
    const req2 = createRequestWithBody({ id: 123 });
    const res2 = await deleteFromFavorite(req2, {
      getSessionFn: mockGetSessionFn,
      prismaClient: mockPrisma,
    });
    expect(res2.status).toBe(400);
  });

  // ------ Test 3️⃣ ------
  it("should return 404 if favorite not found or user unauthorized", async () => {
    mockGetSessionFn.mockResolvedValue({ user: { email: "user@test.com", id: "user1" } });

    mockPrisma.favorite.findUnique.mockResolvedValue(null); // favorite not found

    const req = createRequestWithBody({ id: "fav1" });

    const res = await deleteFromFavorite(req, {
      getSessionFn: mockGetSessionFn,
      prismaClient: mockPrisma,
    });

    expect(mockPrisma.favorite.findUnique).toHaveBeenCalledWith({ where: { id: "fav1" } });
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Favorite not found or unauthorized");
  });

  // ------ Test 4️⃣ ------
  it("should return 404 if favorite belongs to another user", async () => {
    mockGetSessionFn.mockResolvedValue({ user: { email: "user@test.com", id: "user1" } });

    mockPrisma.favorite.findUnique.mockResolvedValue({
      id: "fav1",
      userId: "user2", // different user
    });

    const req = createRequestWithBody({ id: "fav1" });

    const res = await deleteFromFavorite(req, {
      getSessionFn: mockGetSessionFn,
      prismaClient: mockPrisma,
    });

    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Favorite not found or unauthorized");
  });

  // ------ Test 5️⃣ ------
  it("should delete favorite and return success", async () => {
    mockGetSessionFn.mockResolvedValue({ user: { email: "user@test.com", id: "user1" } });

    mockPrisma.favorite.findUnique.mockResolvedValue({
      id: "fav1",
      userId: "user1",
    });

    mockPrisma.favorite.delete.mockResolvedValue({ id: "fav1" });

    const req = createRequestWithBody({ id: "fav1" });

    const res = await deleteFromFavorite(req, {
      getSessionFn: mockGetSessionFn,
      prismaClient: mockPrisma,
    });

    expect(mockPrisma.favorite.delete).toHaveBeenCalledWith({ where: { id: "fav1" } });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  // ------ Test 6️⃣ ------
  it("should return 500 on unexpected errors", async () => {
    mockGetSessionFn.mockRejectedValue(new Error("Unexpected error"));

    const req = createRequestWithBody({ id: "fav1" });

    const res = await deleteFromFavorite(req, {
      getSessionFn: mockGetSessionFn,
      prismaClient: mockPrisma,
    });

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Internal server error");
  });
});

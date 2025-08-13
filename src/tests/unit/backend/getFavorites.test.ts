import { getFavorites } from "@/lib/server/handlers/getFavorites";
import { mockPrisma } from "@/tests/jest.setup";

const mockGetSession = jest.fn();

describe("getFavorites", () => {
  // ------ Test 1️⃣ ------
  it("returns 401 if user is not authenticated", async () => {
    mockGetSession.mockResolvedValue(null);

    const res = await getFavorites({
      getSessionFn: mockGetSession,
      prismaClient: mockPrisma,
    });

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data).toEqual({ error: "Unauthorized" });

    expect(mockGetSession).toHaveBeenCalled();
  });

  // ------ Test 2️⃣ ------
  it("returns 204 if favorites are empty", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "123", email: "test@example.com" } });
    mockPrisma.favorite.findMany.mockResolvedValue([]);

    const res = await getFavorites({
      getSessionFn: mockGetSession,
      prismaClient: mockPrisma,
    });

    expect(res.status).toBe(204);
    expect(mockPrisma.favorite.findMany).toHaveBeenCalledWith({
      where: { userId: "123" },
      orderBy: { createdAt: "desc" },
    });
  });

  // ------ Test 3️⃣ ------
  it("returns favorites with status 200", async () => {
    const mockFavorites = [{ id: 1, text: "Hello" }];
    mockGetSession.mockResolvedValue({ user: { id: "123", email: "test@example.com" } });
    mockPrisma.favorite.findMany.mockResolvedValue(mockFavorites);

    const res = await getFavorites({
      getSessionFn: mockGetSession,
      prismaClient: mockPrisma,
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual(mockFavorites);
  });

  // ------ Test 4️⃣ ------
  it("returns 500 if an error occurs", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "123", email: "test@example.com" } });
    mockPrisma.favorite.findMany.mockRejectedValue(new Error("DB error"));

    const res = await getFavorites({
      getSessionFn: mockGetSession,
      prismaClient: mockPrisma,
    });

    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data).toEqual({ error: "Failed to fetch favorites" });
  });
});

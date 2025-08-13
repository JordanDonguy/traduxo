import { getHistory } from "@/lib/server/handlers/getHistory";
import { mockPrisma } from "@/tests/jest.setup";

const mockGetSession = jest.fn();

describe("getHistory", () => {
  // ------ Test 1️⃣ ------
  it("returns 401 if user is not authenticated", async () => {
    mockGetSession.mockResolvedValue(null);

    const res = await getHistory({
      getSessionFn: mockGetSession,
      prismaClient: mockPrisma,
    });

    expect(res.status).toBe(401);

    const data = await res.json();
    expect(data).toEqual({ error: "Unauthorized" });

    expect(mockGetSession).toHaveBeenCalled();
  });

  // ------ Test 2️⃣ ------
  it("returns 204 if history is empty", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "123", email: "test@example.com" } });
    mockPrisma.history.findMany.mockResolvedValue([]);

    const res = await getHistory({
      getSessionFn: mockGetSession,
      prismaClient: mockPrisma,
    });

    expect(res.status).toBe(204);
    expect(mockPrisma.history.findMany).toHaveBeenCalledWith({
      where: { userId: "123" },
      orderBy: { createdAt: "desc" },
    });
  });

  // ------ Test 3️⃣ ------
  it("returns history with status 200", async () => {
    const mockHistory = [{ id: 1, text: "Hello" }];
    mockGetSession.mockResolvedValue({ user: { id: "123", email: "test@example.com" } });
    mockPrisma.history.findMany.mockResolvedValue(mockHistory);

    const res = await getHistory({
      getSessionFn: mockGetSession,
      prismaClient: mockPrisma,
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual(mockHistory);
  });

  // ------ Test 4️⃣ ------
  it("returns 500 if an error occurs", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "123", email: "test@example.com" } });
    mockPrisma.history.findMany.mockRejectedValue(new Error("DB error"));

    const res = await getHistory({
      getSessionFn: mockGetSession,
      prismaClient: mockPrisma,
    });

    expect(res.status).toBe(500);

    const data = await res.json();
    expect(data).toEqual({ error: "Failed to fetch history" });
  });
});

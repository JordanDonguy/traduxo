import { getTranslations } from "@/lib/server/handlers/getTranslations";
import { mockPrisma } from "@/tests/jest.setup";

const mockGetSession = jest.fn();

describe("getTranslations", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 if user is not authenticated", async () => {
    mockGetSession.mockResolvedValue(null);

    const res = await getTranslations({
      getSessionFn: mockGetSession,
      prismaClient: mockPrisma,
    });

    expect(res.status).toBe(401);

    const data = await res.json();
    expect(data).toEqual({ error: "Unauthorized" });

    expect(mockGetSession).toHaveBeenCalled();
  });

  it("returns 204 if history is empty", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "123", email: "test@example.com" } });
    mockPrisma.history.findMany.mockResolvedValue([]);

    const res = await getTranslations({
      getSessionFn: mockGetSession,
      prismaClient: mockPrisma,
    });

    expect(res.status).toBe(204);
    expect(mockPrisma.history.findMany).toHaveBeenCalledWith({
      where: { userId: "123" },
      orderBy: { createdAt: "desc" },
    });
  });

  it("returns history with status 200", async () => {
    const mockHistory = [{ id: 1, text: "Hello" }];
    mockGetSession.mockResolvedValue({ user: { id: "123", email: "test@example.com" } });
    mockPrisma.history.findMany.mockResolvedValue(mockHistory);

    const res = await getTranslations({
      getSessionFn: mockGetSession,
      prismaClient: mockPrisma,
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual(mockHistory);
  });

  it("returns 500 if an error occurs", async () => {
    mockGetSession.mockResolvedValue({ user: { id: "123", email: "test@example.com" } });
    mockPrisma.history.findMany.mockRejectedValue(new Error("DB error"));

    const res = await getTranslations({
      getSessionFn: mockGetSession,
      prismaClient: mockPrisma,
    });

    expect(res.status).toBe(500);

    const data = await res.json();
    expect(data).toEqual({ error: "Failed to fetch history" });
  });
});

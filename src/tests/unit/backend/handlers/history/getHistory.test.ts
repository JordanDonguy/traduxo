import { getHistory } from "@/lib/server/handlers/history/getHistory";
import { mockPrisma } from "@/tests/jest.setup";
import { createMockRequest } from "../../mocks/requestMocks";
import { checkAuth } from "@/lib/server/middlewares/checkAuth";

jest.mock('@/lib/server/middlewares/checkAuth');

describe("getHistory handler", () => {
  beforeEach(() => {
    (checkAuth as jest.Mock).mockResolvedValue({ user: { id: "1", email: "user@example.com" } });
  });

  // ------ Test 1️⃣ ------
  it("returns 401 if not logged in", async () => {
    (checkAuth as jest.Mock).mockResolvedValue(null);
    const req = createMockRequest({});

    const res = await getHistory(req, { prismaClient: mockPrisma });

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data).toEqual({ error: "Unauthorized" });
  });

  // ------ Test 2️⃣ ------
  it("returns 204 if history is empty", async () => {
    mockPrisma.history.findMany.mockResolvedValue([]);

    const req = createMockRequest({});

    const res = await getHistory(req, { prismaClient: mockPrisma });

    expect(res.status).toBe(204);
    expect(mockPrisma.history.findMany).toHaveBeenCalledWith({
      where: { userId: "1" },
      orderBy: { createdAt: "desc" },
    });
  });

  // ------ Test 3️⃣ ------
  it("returns history with status 200", async () => {
    const mockHistory = [{ id: 1, text: "Hello" }];
    mockPrisma.history.findMany.mockResolvedValue(mockHistory);

    const req = createMockRequest({});

    const res = await getHistory(req, { prismaClient: mockPrisma });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual(mockHistory);
  });

  // ------ Test 4️⃣ ------
  it("returns 500 if an error occurs", async () => {
    mockPrisma.history.findMany.mockRejectedValue(new Error("DB error"));

    const req = createMockRequest({});

    const res = await getHistory(req, { prismaClient: mockPrisma });

    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data).toEqual({ error: "Failed to fetch history" });
  });
});

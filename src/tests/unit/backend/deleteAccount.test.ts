jest.mock("@/lib/server/prisma");

import { mockPrisma } from "@/tests/jest.setup";
import { deleteAccount } from "@/lib/server/handlers/deleteAccount";

const mockGetSession = jest.fn();

function createMockContext() {
  return {
    getSessionFn: mockGetSession,
    prismaClient: mockPrisma,
  };
}

// ------ Clear mocks before each tests ------
beforeEach(() => {
  jest.clearAllMocks();
});

describe("deleteAccount", () => {
  // ------ Test 1️⃣ ------
  it("returns 401 if session is missing or email not present", async () => {
    mockGetSession.mockResolvedValue(null);

    const context = createMockContext();
    const response = await deleteAccount(context);

    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.message).toBe("Unauthorized");
  });

  // ------ Test 2️⃣ ------
  it("returns 404 if user is not found", async () => {
    const email = "user@example.com";
    mockGetSession.mockResolvedValue({ user: { email } });
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const context = createMockContext();
    const response = await deleteAccount(context);

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { email },
      select: { id: true },
    });
    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json.message).toBe("User not found");
  });

  // ------ Test 3️⃣ ------
  it("deletes the user and returns 200 on success", async () => {
    const email = "user@example.com";
    const userId = 1;
    mockGetSession.mockResolvedValue({ user: { email } });
    mockPrisma.user.findUnique.mockResolvedValue({ id: userId });
    mockPrisma.user.delete.mockResolvedValue({});

    const context = createMockContext();
    const response = await deleteAccount(context);

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { email },
      select: { id: true },
    });
    expect(mockPrisma.user.delete).toHaveBeenCalledWith({
      where: { id: userId },
    });
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.message).toBe("Account deleted successfully");
  });

  // ------ Test 4️⃣ ------
  it("returns 400 if prisma throws an error", async () => {
    const email = "user@example.com";
    mockGetSession.mockResolvedValue({ user: { email } });
    mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });
    mockPrisma.user.delete.mockRejectedValue(new Error("DB error"));

    const context = createMockContext();
    const response = await deleteAccount(context);

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.message).toBe("Invalid request");
    expect(json.error).toBeDefined();
  });
});

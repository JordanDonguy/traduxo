jest.mock("@/lib/server/prisma");

import { mockPrisma } from "@/tests/jest.setup";
import { linkGoogle } from "@/lib/server/handlers/linkGoogle";

const mockGetSession = jest.fn();

function createMockContext() {
  return {
    getSessionFn: mockGetSession,
    prismaClient: mockPrisma,
  };
}

describe("linkGoogle", () => {
  // ------ Test 1️⃣ ------
  it("returns 401 if session is missing or email not present", async () => {
    mockGetSession.mockResolvedValue(null);

    const context = createMockContext();
    const response = await linkGoogle(context);

    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.error).toBe("Unauthorized");
  });

  // ------ Test 2️⃣ ------
  it("returns 200 and updates google_linking if session exists", async () => {
    const fakeEmail = "user@example.com";
    mockGetSession.mockResolvedValue({ user: { email: fakeEmail } });
    mockPrisma.user.update.mockResolvedValue({});

    const context = createMockContext();
    const response = await linkGoogle(context);

    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { email: fakeEmail },
      data: { google_linking: expect.any(String) },
    });
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.message).toBe("Google linking started");
  });

  // ------ Test 3️⃣ ------
  it("returns 500 if prisma update throws", async () => {
    const fakeEmail = "user@example.com";
    mockGetSession.mockResolvedValue({ user: { email: fakeEmail } });
    mockPrisma.user.update.mockRejectedValue(new Error("DB error"));

    const context = createMockContext();
    const response = await linkGoogle(context);

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toBe("Database update failed");
  });
});

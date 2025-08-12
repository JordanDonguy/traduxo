import { deleteTranslation } from "@/lib/server/handlers/deleteTranslation";
import { mockPrisma } from "@/tests/jest.setup";

const mockGetSessionFn = jest.fn();

// Helper to create mock Request with JSON body
function createRequestWithBody(body: unknown) {
  return {
    json: () => Promise.resolve(body),
  } as Request;
}

describe("deleteTranslation handler", () => {
  // ------ Test 1️⃣ ------
  it("should reject unauthorized users", async () => {
    mockGetSessionFn.mockResolvedValue(null);

    const req = createRequestWithBody({ id: "some-id" });

    const res = await deleteTranslation(req, {
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
    const res1 = await deleteTranslation(req1, {
      getSessionFn: mockGetSessionFn,
      prismaClient: mockPrisma,
    });
    expect(res1.status).toBe(400);
    const json1 = await res1.json();
    expect(json1.error).toMatch(/Invalid or missing translation id/);

    // invalid id type
    const req2 = createRequestWithBody({ id: 123 });
    const res2 = await deleteTranslation(req2, {
      getSessionFn: mockGetSessionFn,
      prismaClient: mockPrisma,
    });
    expect(res2.status).toBe(400);
  });

  // ------ Test 3️⃣ ------
  it("should return 404 if translation not found or user unauthorized", async () => {
    mockGetSessionFn.mockResolvedValue({ user: { email: "user@test.com", id: "user1" } });

    mockPrisma.history.findUnique.mockResolvedValue(null); // translation not found

    const req = createRequestWithBody({ id: "trans1" });

    const res = await deleteTranslation(req, {
      getSessionFn: mockGetSessionFn,
      prismaClient: mockPrisma,
    });

    expect(mockPrisma.history.findUnique).toHaveBeenCalledWith({ where: { id: "trans1" } });
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Translation not found or unauthorized");
  });

  // ------ Test 4️⃣ ------
  it("should return 404 if translation belongs to another user", async () => {
    mockGetSessionFn.mockResolvedValue({ user: { email: "user@test.com", id: "user1" } });

    mockPrisma.history.findUnique.mockResolvedValue({
      id: "trans1",
      userId: "user2", // different user
    });

    const req = createRequestWithBody({ id: "trans1" });

    const res = await deleteTranslation(req, {
      getSessionFn: mockGetSessionFn,
      prismaClient: mockPrisma,
    });

    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toBe("Translation not found or unauthorized");
  });

  // ------ Test 5️⃣ ------
  it("should delete translation and return success", async () => {
    mockGetSessionFn.mockResolvedValue({ user: { email: "user@test.com", id: "user1" } });

    mockPrisma.history.findUnique.mockResolvedValue({
      id: "trans1",
      userId: "user1",
    });

    mockPrisma.history.delete.mockResolvedValue({ id: "trans1" });

    const req = createRequestWithBody({ id: "trans1" });

    const res = await deleteTranslation(req, {
      getSessionFn: mockGetSessionFn,
      prismaClient: mockPrisma,
    });

    expect(mockPrisma.history.delete).toHaveBeenCalledWith({ where: { id: "trans1" } });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  // ------ Test 6️⃣ ------
  it("should return 500 on unexpected errors", async () => {
    mockGetSessionFn.mockRejectedValue(new Error("Unexpected error"));

    const req = createRequestWithBody({ id: "trans1" });

    const res = await deleteTranslation(req, {
      getSessionFn: mockGetSessionFn,
      prismaClient: mockPrisma,
    });

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Internal server error");
  });
});

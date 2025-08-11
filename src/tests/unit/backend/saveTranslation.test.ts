import { saveTranslation } from "@/lib/server/handlers/saveTranslation";
import { mockPrisma } from "@/tests/jest.setup";

const mockGetSessionFn = jest.fn();

const makeReq = (body: unknown) => ({
  json: jest.fn().mockResolvedValue(body),
} as unknown as Request);

describe("saveTranslation handler", () => {
  // ------ Clear mocks before each tests ------
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.history.count.mockReset();
    mockPrisma.history.deleteMany.mockReset();
  });

  // ------ Test 1️⃣ ------
  it("returns 401 if user not authenticated", async () => {
    mockGetSessionFn.mockResolvedValue(null);
    const req = makeReq({});

    const res = await saveTranslation(req, {
      getSessionFn: mockGetSessionFn,
      prismaClient: mockPrisma,
    });

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json).toHaveProperty("error", "Unauthorized");
  });

  // ------ Test 2️⃣ ------
  it("returns 400 if translations array is too short", async () => {
    mockGetSessionFn.mockResolvedValue({ user: { email: "test@example.com", id: "user1" } });
    const req = makeReq({
      translations: ["only one translation"],
      inputLang: "en",
      outputLang: "fr",
    });

    const res = await saveTranslation(req, {
      getSessionFn: mockGetSessionFn,
      prismaClient: mockPrisma,
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json).toHaveProperty("error");
    expect(json.error).toContainEqual(
      expect.objectContaining({ message: "At least two translations required" })
    );
  });

  // ------ Test 3️⃣ ------
  it("returns 400 if language codes invalid", async () => {
    mockGetSessionFn.mockResolvedValue({ user: { email: "test@example.com", id: "user1" } });
    const req = makeReq({
      translations: ["hello", "bonjour"],
      inputLang: "english", // invalid length
      outputLang: "fr",
    });

    const res = await saveTranslation(req, {
      getSessionFn: mockGetSessionFn,
      prismaClient: mockPrisma,
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ message: "Language code must be 2 characters" }),
      ])
    );
  });

  // ------ Test 4️⃣ ------
  it("returns 400 if language codes fail regex pattern", async () => {
    mockGetSessionFn.mockResolvedValue({ user: { email: "test@example.com", id: "user1" } });
    const req = makeReq({
      translations: ["hello", "bonjour"],
      inputLang: "1n", // length 2 but invalid chars
      outputLang: "fr",
    });

    const res = await saveTranslation(req, {
      getSessionFn: mockGetSessionFn,
      prismaClient: mockPrisma,
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ message: "Language code must contain only letters" }),
      ])
    );
  });

  // ------ Test 5️⃣ ------
  it("creates history record successfully and returns success", async () => {
    mockGetSessionFn.mockResolvedValue({ user: { email: "test@example.com", id: "user1" } });
    mockPrisma.history.create.mockResolvedValue({ id: "record1" });

    const req = makeReq({
      translations: ["hello", "bonjour", "salut", "coucou", "bonsoir"],
      inputLang: "en",
      outputLang: "fr",
    });

    const res = await saveTranslation(req, {
      getSessionFn: mockGetSessionFn,
      prismaClient: mockPrisma,
    });

    expect(mockPrisma.history.create).toHaveBeenCalledWith({
      data: {
        userId: "user1",
        inputText: "hello",
        translation: "bonjour",
        alt1: "salut",
        alt2: "coucou",
        alt3: "bonsoir",
        inputLang: "en",
        outputLang: "fr",
      },
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ success: true });
  });

  // ------ Test 6️⃣ ------
  it("deletes oldest history records when user exceeds max history limit", async () => {
    const userId = "user1";
    mockGetSessionFn.mockResolvedValue({ user: { email: "test@example.com", id: userId } });

    // Simulate user already has MAX_HISTORY + 3 records
    mockPrisma.history.count.mockResolvedValue(103);

    mockPrisma.history.deleteMany.mockResolvedValue({ count: 3 });
    mockPrisma.history.create.mockResolvedValue({ id: "record2" });

    const req = makeReq({
      translations: ["hello", "bonjour", "salut", "coucou", "bonsoir"],
      inputLang: "en",
      outputLang: "fr",
    });

    const res = await saveTranslation(req, {
      getSessionFn: mockGetSessionFn,
      prismaClient: mockPrisma,
    });

    // It should call count once
    expect(mockPrisma.history.count).toHaveBeenCalledWith({ where: { userId } });

    // It should delete exactly (103 - 100 + 1) = 4 oldest records (adjust if you want to keep 200 total)
    expect(mockPrisma.history.deleteMany).toHaveBeenCalledWith({
      where: { userId },
      orderBy: { createdAt: "asc" },
      take: 4,
    });

    // It should still create the new history record
    expect(mockPrisma.history.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ userId }),
    }));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ success: true });
  });


  // ------ Test 7️⃣ ------
  it("returns 500 on prisma error", async () => {
    mockGetSessionFn.mockResolvedValue({ user: { email: "test@example.com", id: "user1" } });
    mockPrisma.history.create.mockRejectedValue(new Error("DB error"));

    const req = makeReq({
      translations: ["hello", "bonjour"],
      inputLang: "en",
      outputLang: "fr",
    });

    const res = await saveTranslation(req, {
      getSessionFn: mockGetSessionFn,
      prismaClient: mockPrisma,
    });

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json).toHaveProperty("error", "Internal server error");
  });
});

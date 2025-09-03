import { saveToHistory } from "@/lib/server/handlers/history/saveToHistory";
import { mockPrisma } from "@/tests/jest.setup";
import { createMockRequest } from "../../mocks/requestMocks";
import { checkAuth } from "@/lib/server/middlewares/checkAuth";

jest.mock('@/lib/server/middlewares/checkAuth');

describe("saveToHistory handler", () => {
  beforeEach(() => {
    mockPrisma.history.count.mockReset();
    mockPrisma.history.create.mockReset();
    mockPrisma.$queryRaw.mockReset();
    (checkAuth as jest.Mock).mockResolvedValue({ user: { id: "1", email: "user@example.com" } });
  });

  // ------ Test 1️⃣ ------
  it("returns 401 if not logged in", async () => {
    (checkAuth as jest.Mock).mockResolvedValue(null);
    const req = createMockRequest({});

    const res = await saveToHistory(req, { prismaClient: mockPrisma });

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json).toHaveProperty("error", "Unauthorized");
  });

  // ------ Test 2️⃣ ------
  it("returns 400 if missing expression or main_translation", async () => {
    const req = createMockRequest({
      translations: [{ type: "expression", value: "hello" }], // missing main_translation
      inputLang: "en",
      outputLang: "fr",
    });

    const res = await saveToHistory(req, { prismaClient: mockPrisma });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: "At least one expression and one main_translation required",
        }),
      ])
    );
  });

  // ------ Test 3️⃣ ------
  it("returns 400 if language codes invalid", async () => {
    const req = createMockRequest({
      translations: [
        { type: "expression", value: "hello" },
        { type: "main_translation", value: "bonjour" },
      ],
      inputLang: "english",
      outputLang: "fr",
    });

    const res = await saveToHistory(req, { prismaClient: mockPrisma });

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
    const req = createMockRequest({
      translations: [
        { type: "expression", value: "hello" },
        { type: "main_translation", value: "bonjour" },
      ],
      inputLang: "1n",
      outputLang: "fr",
    });

    const res = await saveToHistory(req, { prismaClient: mockPrisma });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ message: "Language code must contain only letters" }),
      ])
    );
  });

  // ------ Test 5️⃣ ------
  it("creates history record successfully and returns success & res", async () => {
    mockPrisma.history.create.mockResolvedValue({ id: "record1" });
    mockPrisma.history.count.mockResolvedValue(50); // Below limit, no deletion

    const req = createMockRequest({
      translations: [
        { type: "expression", value: "hello" },
        { type: "main_translation", value: "bonjour" },
        { type: "alternative", value: "salut" },
        { type: "alternative", value: "coucou" },
        { type: "alternative", value: "bonsoir" },
      ],
      inputLang: "en",
      outputLang: "fr",
    });

    const res = await saveToHistory(req, { prismaClient: mockPrisma });

    expect(mockPrisma.history.create).toHaveBeenCalledWith({
      data: {
        userId: "1",
        inputText: "hello",
        translation: "bonjour",
        alt1: "salut",
        alt2: "coucou",
        alt3: "bonsoir",
        inputLang: "en",
        outputLang: "fr",
      },
    });

    expect(mockPrisma.history.count).toHaveBeenCalledWith({ where: { userId: "1" } });
    expect(mockPrisma.$queryRaw).not.toHaveBeenCalled(); // no deletion

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ success: true, data: { id: "record1" } });
  });

  // ------ Test 6️⃣ ------
  it("deletes oldest history record when user exceeds max history limit", async () => {
    mockPrisma.history.create.mockResolvedValue({ id: "record2" });
    mockPrisma.history.count.mockResolvedValue(101); // Over limit triggers deletion

    const req = createMockRequest({
      translations: [
        { type: "expression", value: "hello" },
        { type: "main_translation", value: "bonjour" },
        { type: "alternative", value: "salut" },
        { type: "alternative", value: "coucou" },
        { type: "alternative", value: "bonsoir" },
      ],
      inputLang: "en",
      outputLang: "fr",
    });

    const res = await saveToHistory(req, { prismaClient: mockPrisma });

    expect(mockPrisma.history.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: "1" }) })
    );
    expect(mockPrisma.history.count).toHaveBeenCalledWith({ where: { userId: "1" } });
    expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);

    const [strings, ...substitutions] = mockPrisma.$queryRaw.mock.calls[0];
    expect(strings.join('')).toContain('DELETE FROM "History"');
    expect(substitutions).toContain("1");

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ success: true, data: { id: "record2" } });
  });

  // ------ Test 7️⃣ ------
  it("returns 500 on prisma error", async () => {
    mockPrisma.history.create.mockRejectedValue(new Error("DB error"));

    const req = createMockRequest({
      translations: [
        { type: "expression", value: "hello" },
        { type: "main_translation", value: "bonjour" },
      ],
      inputLang: "en",
      outputLang: "fr",
    });

    const res = await saveToHistory(req, { prismaClient: mockPrisma });

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json).toHaveProperty("error", "Internal server error");
  });
});

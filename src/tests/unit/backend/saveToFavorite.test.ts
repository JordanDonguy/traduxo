import { saveToFavorite } from "@/lib/server/handlers/saveToFavorite";
import { mockPrisma } from "@/tests/jest.setup";

const mockGetSessionFn = jest.fn();

const makeReq = (body: unknown) => ({
  json: jest.fn().mockResolvedValue(body),
} as unknown as Request);

describe("saveToFavorite handler", () => {
  beforeEach(() => {
    mockPrisma.favorite.create.mockReset();
  });

  // ------ Test 1️⃣ ------
  it("returns 401 if user not authenticated", async () => {
    mockGetSessionFn.mockResolvedValue(null);
    const req = makeReq({});

    const res = await saveToFavorite(req, {
      getSessionFn: mockGetSessionFn,
      prismaClient: mockPrisma,
    });

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json).toHaveProperty("error", "Unauthorized");
  });

  // ------ Test 2️⃣ ------
  it("returns 400 if missing expression or main_translation", async () => {
    mockGetSessionFn.mockResolvedValue({ user: { email: "test@example.com", id: "user1" } });
    const req = makeReq({
      translations: [
        { type: "expression", value: "hello" } // missing main_translation
      ],
      inputLang: "en",
      outputLang: "fr",
    });

    const res = await saveToFavorite(req, {
      getSessionFn: mockGetSessionFn,
      prismaClient: mockPrisma,
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContainEqual(
      expect.objectContaining({ message: "At least one expression and one main_translation required" })
    );
  });

  // ------ Test 3️⃣ ------
  it("returns 400 if language codes invalid", async () => {
    mockGetSessionFn.mockResolvedValue({ user: { email: "test@example.com", id: "user1" } });
    const req = makeReq({
      translations: [
        { type: "expression", value: "hello" },
        { type: "main_translation", value: "bonjour" },
      ],
      inputLang: "english",
      outputLang: "fr",
    });

    const res = await saveToFavorite(req, {
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
      translations: [
        { type: "expression", value: "hello" },
        { type: "main_translation", value: "bonjour" },
      ],
      inputLang: "1n",
      outputLang: "fr",
    });

    const res = await saveToFavorite(req, {
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
  it("creates favorite record successfully and returns success", async () => {
    mockGetSessionFn.mockResolvedValue({ user: { email: "test@example.com", id: "user1" } });
    mockPrisma.favorite.create.mockResolvedValue({ id: "fav1" });

    const req = makeReq({
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

    const res = await saveToFavorite(req, {
      getSessionFn: mockGetSessionFn,
      prismaClient: mockPrisma,
    });

    expect(mockPrisma.favorite.create).toHaveBeenCalledWith({
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
    expect(json).toEqual({ success: true, id: "fav1" });
  });

  // ------ Test 6️⃣ ------
  it("returns 500 on prisma error", async () => {
    mockGetSessionFn.mockResolvedValue({ user: { email: "test@example.com", id: "user1" } });
    mockPrisma.favorite.create.mockRejectedValue(new Error("DB error"));

    const req = makeReq({
      translations: [
        { type: "expression", value: "hello" },
        { type: "main_translation", value: "bonjour" },
      ],
      inputLang: "en",
      outputLang: "fr",
    });

    const res = await saveToFavorite(req, {
      getSessionFn: mockGetSessionFn,
      prismaClient: mockPrisma,
    });

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json).toHaveProperty("error", "Internal server error");
  });
});

import { saveToFavorite } from "@/lib/server/handlers/favorite/saveToFavorite";
import { mockPrisma } from "@/tests/jest.setup";
import { createMockRequest } from "../../mocks/requestMocks";
import { checkAuth } from "@/lib/server/middlewares/checkAuth";

jest.mock('@/lib/server/middlewares/checkAuth');

describe("saveToFavorite handler", () => {
  beforeEach(() => {
    mockPrisma.favorite.create.mockReset();
     (checkAuth as jest.Mock).mockResolvedValue({ user: { id: "1", email: "user@example.com" } });
  });

  // ------ Test 1️⃣ ------
  it("returns 401 if not logged in", async () => {
    (checkAuth as jest.Mock).mockResolvedValue(null);
    const req = createMockRequest({}, {});

    const res = await saveToFavorite(req, { prismaClient: mockPrisma });

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
    }, {
      "x-user-id": "1",
      "x-user-email": "test@example.com",
    });

    const res = await saveToFavorite(req, { prismaClient: mockPrisma });

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
    }, {
      "x-user-id": "1",
      "x-user-email": "test@example.com",
    });

    const res = await saveToFavorite(req, { prismaClient: mockPrisma });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: "Language code must be 2 characters",
        }),
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
    }, {
      "x-user-id": "1",
      "x-user-email": "test@example.com",
    });

    const res = await saveToFavorite(req, { prismaClient: mockPrisma });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: "Language code must contain only letters",
        }),
      ])
    );
  });

  // ------ Test 5️⃣ ------
  it("creates favorite record successfully and returns success", async () => {
    mockPrisma.favorite.create.mockResolvedValue({ id: "fav1" });

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
    }, {
      "x-user-id": "1",
      "x-user-email": "test@example.com",
    });

    const res = await saveToFavorite(req, { prismaClient: mockPrisma });

    expect(mockPrisma.favorite.create).toHaveBeenCalledWith({
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

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ success: true, id: "fav1" });
  });

  // ------ Test 6️⃣ ------
  it("returns 500 on prisma error", async () => {
    mockPrisma.favorite.create.mockRejectedValue(new Error("DB error"));

    const req = createMockRequest({
      translations: [
        { type: "expression", value: "hello" },
        { type: "main_translation", value: "bonjour" },
      ],
      inputLang: "en",
      outputLang: "fr",
    }, {
      "x-user-id": "1",
      "x-user-email": "test@example.com",
    });

    const res = await saveToFavorite(req, { prismaClient: mockPrisma });

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json).toHaveProperty("error", "Internal server error");
  });
});

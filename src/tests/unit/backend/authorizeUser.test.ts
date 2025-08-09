import { authorizeUser } from "@/lib/server/auth/authorizeUser";
import { mockPrisma } from "@/tests/jest.setup";
import bcrypt from "bcrypt";
import sanitizeHtml from "sanitize-html";

jest.mock("bcrypt", () => ({
  compare: jest.fn(),
}));

jest.mock("sanitize-html", () => jest.fn((str) => str));

describe("authorizeUser", () => {
  const mockFindUnique = mockPrisma.user.findUnique as jest.Mock;
  const mockBcryptCompare = bcrypt.compare as jest.Mock;
  const mockSanitize = sanitizeHtml as unknown as jest.Mock;

  // ------ Clear mocks before each tests ------
  beforeEach(() => {
    jest.clearAllMocks();
    mockSanitize.mockImplementation((str) => str); // Bypass the real sanitization logic
  });

  // ------ Test 1️⃣ ------
  it("throws NoMailOrPassword when credentials are missing", async () => {
    await expect(authorizeUser(undefined)).rejects.toThrow("NoMailOrPassword");
    await expect(authorizeUser({ email: "test@example.com" })).rejects.toThrow("NoMailOrPassword");
    await expect(authorizeUser({ password: "pass" })).rejects.toThrow("NoMailOrPassword");
  });

  // ------ Test 2️⃣ ------
  it("throws InvalidInput when credentials fail zod validation", async () => {
    await expect(authorizeUser({ email: "invalid", password: "123" }))
      .rejects.toThrow("InvalidInput");
  });

  // ------ Test 3️⃣ ------
  it("throws NoUserFound when prisma returns null", async () => {
    mockFindUnique.mockResolvedValue(null);
    await expect(
      authorizeUser({ email: "test@example.com", password: "password123" })
    ).rejects.toThrow("NoUserFound");
    expect(mockFindUnique).toHaveBeenCalledWith({ where: { email: "test@example.com" } });
  });

  // ------ Test 4️⃣ ------
  it("throws NeedToCreatePassword when user has no password", async () => {
    mockFindUnique.mockResolvedValue({ id: "u1", email: "test@example.com", password: null });
    await expect(
      authorizeUser({ email: "test@example.com", password: "password123" })
    ).rejects.toThrow("NeedToCreatePassword");
  });

  // ------ Test 5️⃣ ------
  it("throws PasswordIncorrect when bcrypt.compare fails", async () => {
    mockFindUnique.mockResolvedValue({ id: "u1", email: "test@example.com", password: "hashed" });
    mockBcryptCompare.mockResolvedValue(false);
    await expect(
      authorizeUser({ email: "test@example.com", password: "wrongpass" })
    ).rejects.toThrow("PasswordIncorrect");
  });

  // ------ Test 6️⃣ ------
  it("returns user object when credentials are valid", async () => {
    mockFindUnique.mockResolvedValue({ id: "u1", email: "test@example.com", password: "hashed" });
    mockBcryptCompare.mockResolvedValue(true);
    const result = await authorizeUser({ email: "test@example.com", password: "password123" });
    expect(result).toEqual({ id: "u1", email: "test@example.com" });
  });
});

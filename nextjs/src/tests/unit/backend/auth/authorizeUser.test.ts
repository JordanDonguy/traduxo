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

  // ------ Add a mock implementation for sanitizing input ------
  beforeEach(() => {
    mockSanitize.mockImplementation((str) => str); // Bypass the real sanitization logic
  });

  // ------ Test 1️⃣ ------
  it("returns failure when credentials are missing", async () => {
    const result1 = await authorizeUser(undefined);
    expect(result1).toEqual({
      success: false,
      reason: "Please provide your email and password.",
    });

    const result2 = await authorizeUser({ email: "test@example.com" });
    expect(result2).toEqual({
      success: false,
      reason: "Please provide your email and password.",
    });

    const result3 = await authorizeUser({ password: "pass" });
    expect(result3).toEqual({
      success: false,
      reason: "Please provide your email and password.",
    });
  });

  // ------ Test 2️⃣ ------
  it("returns failure when credentials fail zod validation", async () => {
    const result = await authorizeUser({ email: "invalid", password: "123" });
    expect(result).toEqual({
      success: false,
      reason: "Some of the input fields are invalid.",
    });
  });

  // ------ Test 3️⃣ ------
  it("returns failure when prisma returns null (no user found)", async () => {
    mockFindUnique.mockResolvedValue(null);
    const result = await authorizeUser({ email: "test@example.com", password: "password123" });
    expect(result).toEqual({
      success: false,
      reason: "No account found with this email, please sign up.",
    });
  });

  // ------ Test 4️⃣ ------
  it("returns failure when user has no password", async () => {
    mockFindUnique.mockResolvedValue({ id: "u1", email: "test@example.com", password: null });
    const result = await authorizeUser({ email: "test@example.com", password: "password123" });
    expect(result).toEqual({
      success: false,
      reason: "This account uses Google sign-in. Log in with Google first, then set a password in your profile.",
    });
  });

  // ------ Test 5️⃣ ------
  it("returns failure when bcrypt.compare fails", async () => {
    mockFindUnique.mockResolvedValue({ id: "u1", email: "test@example.com", password: "hashed" });
    mockBcryptCompare.mockResolvedValue(false);

    const result = await authorizeUser({ email: "test@example.com", password: "wrongpass" });
    expect(result).toEqual({
      success: false,
      reason: "The email and password you entered are incorrect."
    });
  });

  // ------ Test 6️⃣ ------
  it("returns user object when credentials are valid", async () => {
    mockFindUnique.mockResolvedValue({ id: "u1", email: "test@example.com", password: "hashed" });
    mockBcryptCompare.mockResolvedValue(true);

    const result = await authorizeUser({ email: "test@example.com", password: "password123" });

    expect(result).toEqual({
      success: true,
      user: {
        id: "u1",
        email: "test@example.com",
        language: undefined,
        providers: undefined,
      },
    });
  });
});

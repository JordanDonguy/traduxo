import { handleGoogleSignIn } from "@/lib/server/auth/handleGoogleSignIn";
import { mockPrisma } from "@/tests/jest.setup";

describe("handleGoogleSignIn", () => {
  // ------ Test 1️⃣ ------
  it("throws error if email is missing", async () => {
    await expect(handleGoogleSignIn("")).rejects.toThrow("Missing email");
  });

  // ------ Test 2️⃣ ------
  it("creates a new user if none exists", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue({ id: "123", email: "test@example.com" });

    const result = await handleGoogleSignIn("test@example.com");

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { email: "test@example.com" } });
    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: { email: "test@example.com", providers: ["Google"] },
    });
    expect(result).toEqual({ success: true });
  });

  // ------ Test 3️⃣ ------
  it("allows Google sign-in if existing user already has Google provider", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "123",
      email: "test@example.com",
      providers: ["Google"],
    });

    const result = await handleGoogleSignIn("test@example.com");

    expect(result).toEqual({ success: true });
  });

  // ------ Test 4️⃣ ------
  it("blocks sign-in if credentials account exists without Google provider", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "123",
      email: "test@example.com",
      providers: ["Credentials"],
      google_linking: null,
    });

    mockPrisma.user.update.mockResolvedValue({}); // simulate linking timestamp update

    const result = await handleGoogleSignIn("test@example.com");

    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: "123" },
      data: { google_linking: expect.any(String) },
    });
    expect(result).toEqual({ success: false, reason: "NeedGoogleLinking" });
  });

  // ------ Test 5️⃣ ------
  it("returns UpdateFailed if updating google_linking fails", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "123",
      email: "test@example.com",
      providers: ["Credentials"],
      google_linking: null,
    });
    mockPrisma.user.update.mockRejectedValue(new Error("DB error"));

    const result = await handleGoogleSignIn("test@example.com");

    expect(result).toEqual({ success: false, reason: "UpdateFailed" });
  });
});

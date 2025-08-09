import { handleGoogleSignIn } from "@/lib/server/auth/handleGoogleSignIn";
import { mockPrisma } from "@/tests/jest.setup";

describe("handleGoogleSignIn", () => {
  // Clear call history & results before each test so mocks don't leak between tests
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ------ Test 1️⃣ ------
  it("throws error if email is missing", async () => {
    await expect(handleGoogleSignIn(""))
      .rejects
      .toThrow("Missing email");
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
  it("blocks sign-in if credentials account exists without Google provider and no linking", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "123",
      email: "test@example.com",
      providers: ["Credentials"],
      google_linking: null,
    });

    const result = await handleGoogleSignIn("test@example.com");

    expect(result).toEqual({ success: false, reason: "NeedGoogleLinking" });
  });

  // ------ Test 5️⃣ ------
  it("allows sign-in and updates providers if linking initiated within 60s", async () => {
    const recentLinkingDate = new Date(Date.now() - 30 * 1000);

    mockPrisma.user.findUnique.mockResolvedValue({
      id: "123",
      email: "test@example.com",
      providers: ["Credentials"],
      google_linking: recentLinkingDate.toISOString(),
    });
    mockPrisma.user.update.mockResolvedValue({});

    const result = await handleGoogleSignIn("test@example.com");

    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: "123" },
      data: { providers: ["Credentials", "Google"], google_linking: null },
    });
    expect(result).toEqual({ success: true });
  });

  // ------ Test 6️⃣ ------
  it("returns UpdateFailed if updating providers throws error", async () => {
    const recentLinkingDate = new Date(Date.now() - 30 * 1000);

    mockPrisma.user.findUnique.mockResolvedValue({
      id: "123",
      email: "test@example.com",
      providers: ["Credentials"],
      google_linking: recentLinkingDate.toISOString(),
    });
    mockPrisma.user.update.mockRejectedValue(new Error("DB error"));

    const result = await handleGoogleSignIn("test@example.com");

    expect(result).toEqual({ success: false, reason: "UpdateFailed" });
  });

  // ------ Test 7️⃣ ------
  it("blocks if linking time is more than 60s ago", async () => {
    const oldLinkingDate = new Date(Date.now() - 2 * 60 * 1000);

    mockPrisma.user.findUnique.mockResolvedValue({
      id: "123",
      email: "test@example.com",
      providers: ["Credentials"],
      google_linking: oldLinkingDate.toISOString(),
    });

    const result = await handleGoogleSignIn("test@example.com");

    expect(result).toEqual({ success: false, reason: "NeedGoogleLinking" });
  });
});

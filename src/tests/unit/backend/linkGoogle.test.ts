import { linkGoogle } from "@/lib/server/handlers/linkGoogle";
import { mockPrisma } from "@/tests/jest.setup";
import bcrypt from "bcrypt";

jest.mock("bcrypt");

describe("linkGoogle handler", () => {
  const mockReq = (body: unknown) => ({
    json: async () => body,
  } as unknown as Request);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ------ Test 1️⃣ ------
  it("returns 400 if input fails Zod validation", async () => {
    const req = mockReq({ email: "bad-email", password: "" });

    const response = await linkGoogle(req, { prismaClient: mockPrisma });

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe("Invalid email or password.");
  });

  // ------ Test 2️⃣ ------
  it("returns 404 if user not found", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    const req = mockReq({ email: "user@example.com", password: "ValidPass123!" });

    const response = await linkGoogle(req, { prismaClient: mockPrisma });

    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json.error).toBe("User not found.");
  });

  // ------ Test 3️⃣ ------
  it("returns 401 if password is incorrect", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      email: "user@example.com",
      password: "hashed-password",
      google_linking: new Date().toISOString(),
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const req = mockReq({ email: "user@example.com", password: "wrongpass" });
    const response = await linkGoogle(req, { prismaClient: mockPrisma });

    expect(response.status).toBe(401);
    const json = await response.json();
    expect(json.error).toBe("Incorrect password.");
  });

  // ------ Test 4️⃣ ------
  it("returns 400 if google_linking timestamp is older than 10 mins", async () => {
    const oldDate = new Date(Date.now() - 11 * 60 * 1000).toISOString();
    mockPrisma.user.findUnique.mockResolvedValue({
      email: "user@example.com",
      password: "hashed-password",
      google_linking: oldDate,
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const req = mockReq({ email: "user@example.com", password: "correctpass" });
    const response = await linkGoogle(req, { prismaClient: mockPrisma });

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe("For security, Google linking requests expire after 10 minutes. Please sign in with Google again to restart the process.");
  });

  // ------ Test 5️⃣ ------
  it("adds Google provider and returns 200", async () => {
    const recentDate = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    mockPrisma.user.findUnique.mockResolvedValue({
      email: "user@example.com",
      password: "hashed-password",
      google_linking: recentDate,
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    mockPrisma.user.update.mockResolvedValue({});

    const req = mockReq({ email: "user@example.com", password: "correctpass" });
    const response = await linkGoogle(req, { prismaClient: mockPrisma });

    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { email: "user@example.com" },
      data: {
        providers: { push: "Google" },
        google_linking: null,
      },
    });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.message).toBe("Google account linked successfully");
  });

  // ------ Test 6️⃣ ------
  it("returns 500 if unexpected error occurs", async () => {
    mockPrisma.user.findUnique.mockRejectedValue(new Error("DB error"));
    const req = mockReq({ email: "user@example.com", password: "ValidPass123!" }); // valid password

    const response = await linkGoogle(req, { prismaClient: mockPrisma });
    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toBe("Internal server error.");
  });
});

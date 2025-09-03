jest.mock("@/lib/server/prisma");

import { mockPrisma } from "@/tests/jest.setup";
import { signupHandler } from "@/lib/server/handlers/auth/signup";
import bcrypt from "bcrypt";

jest.mock("bcrypt");
jest.mock("sanitize-html", () => jest.fn((str) => str)); // simple passthrough mock for sanitizeHtml

const mockBcryptHash = bcrypt.hash as jest.Mock;

describe("signupHandler", () => {
  // ------ Test 1️⃣ ------
  it("creates a new user and returns 201 on success", async () => {
    const body = { email: "test@example.com", password: "password123" };

    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockBcryptHash.mockResolvedValue("hashedPassword");
    mockPrisma.user.create.mockResolvedValue({ id: 1, email: body.email });

    const response = await signupHandler({ body, prismaClient: mockPrisma });
    expect(response.status).toBe(201);

    const json = await response.json();
    expect(json.message).toBe("User created successfully");

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "test@example.com" },
    });
    expect(mockBcryptHash).toHaveBeenCalledWith("password123", 10);
    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: {
        email: "test@example.com",
        password: "hashedPassword",
        providers: ["Credentials"],
      },
    });
  });

  // ------ Test 2️⃣ ------
  it("returns 409 if user already exists", async () => {
    const body = { email: "exists@example.com", password: "password123" };
    mockPrisma.user.findUnique.mockResolvedValue({ id: 1, email: body.email });

    const response = await signupHandler({ body, prismaClient: mockPrisma });
    expect(response.status).toBe(409);

    const json = await response.json();
    expect(json.message).toBe("User already exists");
  });

  // ------ Test 3️⃣ ------
  it("returns 400 if validation fails (ZodError)", async () => {
    const incorrectInput = { email: 1234, password: false };

    const response = await signupHandler({ body: incorrectInput, prismaClient: mockPrisma });
    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json.error).toBeDefined();
  });

  // ------ Test 4️⃣ ------
  it("returns 500 on unexpected errors", async () => {
    const body = { email: "test2@example.com", password: "password123" };
    mockPrisma.user.findUnique.mockRejectedValue(new Error("DB failure"));

    const response = await signupHandler({ body, prismaClient: mockPrisma });
    expect(response.status).toBe(500);

    const json = await response.json();
    expect(json.error).toBe("Something went wrong");
  });
});

import { forgotPassword } from "@/lib/server/handlers/auth/forgotPassword";
import { mockPrisma } from "@/tests/jest.setup";
import { EmailParams } from "mailersend";
import type { MailerSend } from "mailersend";

// --- Mock Config ---
function createMockRequest(body: unknown) {
  return {
    json: jest.fn().mockResolvedValue(body),
  } as unknown as Request;
}

const mockMailerSendClient: {
  email: {
    send: jest.Mock<Promise<unknown>, [EmailParams]>
  }
} = {
  email: {
    send: jest.fn().mockResolvedValue(true),
  },
};

// --- Tests ---
describe("forgotPassword", () => {
  // ------ Test 1️⃣ ------
  it("returns 400 if email is missing", async () => {
    const req = createMockRequest({});
    const response = await forgotPassword(req, {
      prismaClient: mockPrisma,
      mailerSendClient: mockMailerSendClient as unknown as MailerSend,
    });

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe("Email is required");
  });

  // ------ Test 2️⃣ ------
  it("returns success even if user does not exist", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    const req = createMockRequest({ email: "nonexistent@example.com" });

    const response = await forgotPassword(req, {
      prismaClient: mockPrisma,
      mailerSendClient: mockMailerSendClient as unknown as MailerSend,
    });

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.message).toBe(
      "If this email exists, a reset link has been sent."
    );
  });

  // ------ Test 3️⃣ ------
  it("creates a password reset record and sends email if user exists", async () => {
    const mockUser = { id: "user-id", email: "user@example.com" };
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.passwordReset.create.mockResolvedValue({});

    const req = createMockRequest({ email: "user@example.com" });

    const response = await forgotPassword(req, {
      prismaClient: mockPrisma,
      mailerSendClient: mockMailerSendClient as unknown as MailerSend,
    });

    // Prisma methods called
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "user@example.com" },
    });
    expect(mockPrisma.passwordReset.create).toHaveBeenCalled();

    // MailerSend called
    expect(mockMailerSendClient.email.send).toHaveBeenCalled();
    const emailParams = mockMailerSendClient.email.send.mock.calls[0][0];
    expect(emailParams).toBeInstanceOf(EmailParams);

    // Response
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.message).toBe(
      "If this email exists, a reset link has been sent."
    );
  });

  // ------ Test 4️⃣ ------
  it("returns 500 on unexpected errors", async () => {
    mockPrisma.user.findUnique.mockImplementation(() => {
      throw new Error("Unexpected error");
    });

    const req = createMockRequest({ email: "user@example.com" });

    const response = await forgotPassword(req, {
      prismaClient: mockPrisma,
      mailerSendClient: mockMailerSendClient as unknown as MailerSend,
    });

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json.error).toBe("Something went wrong.");
  });
});

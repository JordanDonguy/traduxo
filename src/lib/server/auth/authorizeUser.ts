import { prisma } from "../prisma";
import { loginSchema } from "@/lib/shared/schemas/auth/login.schemas";
import sanitizeHtml from "sanitize-html";
import bcrypt from "bcrypt";
import { ZodError } from "zod";

export async function authorizeUser(credentials: Record<string, string> | undefined, prismaClient = prisma) {
  try {
    // Throw error if email or password is missing, rejects login
    if (!credentials || !credentials?.email || !credentials?.password) {
      throw new Error("NoMailOrPassword");
    };

    // Validate input with zod
    const { email, password } = loginSchema.parse(credentials);

    // Sanitize email
    const cleanEmail = sanitizeHtml(email, { allowedTags: [], allowedAttributes: {} });

    // Fetch user by email from Prisma
    const user = await prismaClient.user.findUnique({ where: { email: cleanEmail } });

    // Throw error if user not found or error occurs
    if (!user) throw new Error("NoUserFound");

    // Check if user is a Google-only user (e.g. no hashed password)
    if (!user.password) throw new Error("NeedToCreatePassword");

    // Compare provided password with hashed password from DB
    const isValid = await bcrypt.compare(password, user.password);

    // Throw error if password does not match
    if (!isValid) throw new Error("PasswordIncorrect");

    // Return user object to create session
    return {
      id: user.id,
      email: user.email ?? undefined,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error("InvalidInput");
    }
    throw error;
  }
}

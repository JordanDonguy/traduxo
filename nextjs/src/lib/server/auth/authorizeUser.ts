import { prisma } from "../prisma";
import { loginSchema } from "@/lib/shared/schemas/auth/login.schemas";
import sanitizeHtml from "sanitize-html";
import bcrypt from "bcrypt";
import { ZodError } from "zod";

export async function authorizeUser(credentials: Record<string, string> | undefined, prismaClient = prisma) {
  try {
    // Return failure if email or password is missing, rejects login
    if (!credentials || !credentials.email || !credentials.password) {
      return { success: false, reason: "Please provide your email and password." };
    }

    // Validate input with zod and sanitize html
    const { email, password } = loginSchema.parse(credentials);
    const cleanEmail = sanitizeHtml(email, { allowedTags: [], allowedAttributes: {} });

    // Find user by email
    const user = await prismaClient.user.findUnique({ where: { email: cleanEmail } });

    // Return failure if no user or no password set (OAuth only)
    if (!user) return { success: false, reason: "No account found with this email, please sign up." };
    if (!user.password) return { success: false, reason: "This account uses Google sign-in. Log in with Google first, then set a password in your profile." };

    // Compare passwords
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return { success: false, reason: "The email and password you entered are incorrect." };

    // Return user data on success
    return {
      success: true, user: {
        id: user.id,
        email: user.email,
        language: user.systemLang ?? undefined,
        providers: user.providers,
      }
    };
  } catch (error) {
    if (error instanceof ZodError) return { success: false, reason: "Some of the input fields are invalid." };
    console.error("authorizeUser unexpected error:", error);
    throw error;
  }
}

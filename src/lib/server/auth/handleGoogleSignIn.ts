import { prisma } from "../prisma";

type GoogleSignInResult =
  | { success: true }
  | { success: false; reason: "UpdateFailed" | "NeedGoogleLinking" };

export const handleGoogleSignIn = async (email: string, prismaClient = prisma): Promise<GoogleSignInResult> => {
  if (!email) throw new Error("Missing email");
  // Check if user already exists with this Google email
  const existingUser = await prismaClient.user.findUnique({
    where: { email: email },
  });

  // If user does not exist, create new user with Google provider
  if (!existingUser) {
    await prismaClient.user.create({
      data: {
        email,
        providers: ["Google"],
      },
    });
    return { success: true };
  }

  // Block if account exists but user is not already signed in (to avoid hijacking)
  if (
    !existingUser.providers.includes("Google") &&
    existingUser.providers.includes("Credentials")
  ) {
    try {
      await prismaClient.user.update({
        where: { id: existingUser.id },
        data: { google_linking: new Date().toISOString() },
      });
      return { success: false, reason: "NeedGoogleLinking" };
    } catch (error) {
      console.error("Failed to update providers after linking:", error);
      return { success: false, reason: "UpdateFailed" };
    }
  }
  return { success: true };
}

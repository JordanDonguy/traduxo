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
        email: email,
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
    const now = new Date();
    const linkingDate = existingUser.google_linking
      ? new Date(existingUser.google_linking)
      : null;

    // If user recently initiated linking (within 60s), allow and update providers
    if (linkingDate && (now.getTime() - linkingDate.getTime()) / 1000 < 60) {
      const updatedProviders = [...existingUser.providers, "Google"];

      try {
        await prismaClient.user.update({
          where: { id: existingUser.id },
          data: {
            providers: updatedProviders,
            google_linking: null, // Clear the flag after use
          },
        });
        return { success: true };
      } catch (error) {
        console.error("Failed to update providers after linking:", error);
        return { success: false, reason: "UpdateFailed" };
      }
    }
    // Otherwise block Google sign-in
    return { success: false, reason: "NeedGoogleLinking" };
  }

  return { success: true }; // allow Google sign-in if no problem
}

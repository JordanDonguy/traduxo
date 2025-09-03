import { NextResponse } from "next/server";
import type { PrismaClient } from "@prisma/client/extension";
import { checkAuth } from "../../middlewares/checkAuth";

export async function deleteAccount(
  req: Request,
  {
    prismaClient,
  }: {
    prismaClient: Partial<PrismaClient>;
  }) {
  // 1. Authenticate user (web or mobile)
  const auth = await checkAuth(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: userId, email: userEmail } = auth.user;

  try {
    // 2. Fetch user by email
    const user = await prismaClient.user.findUnique({
      where: { email: userEmail },
      select: { id: true },
    });

    // 3. If user not found, return 404
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 4. Delete user by ID
    await prismaClient.user.delete({
      where: { id: userId },
    });

    // 5. Return success response
    return NextResponse.json({ success: true, message: "Account deleted successfully" }, { status: 200 });

  } catch (error) {
    console.error("Error deleting user:", error);

    return NextResponse.json(
      {
        message: "Invalid request",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 400 }
    );
  }
}

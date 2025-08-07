import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/server/auth/authOptions";
import { prisma } from "@/lib/server/prisma";

export async function deleteAccount({
  getSessionFn,
  prismaClient,
}: {
  getSessionFn: typeof getServerSession;
  prismaClient: typeof prisma;
}) {
  // 1. Get user session
  const session = await getSessionFn(authOptions);

  // 2. Check if user is authenticated
  if (!session?.user?.email) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    // 3. Fetch user by email
    const user = await prismaClient.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    // 4. If user not found, return 404
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // 5. Delete user by ID
    await prismaClient.user.delete({
      where: { id: user.id },
    });

    // 6. Return success response
    return NextResponse.json({ message: "Account deleted successfully" }, { status: 200 });

  } catch (error) {
    // 7. Log and return error response
    console.error("Error deleting user:", error);
    return NextResponse.json({ message: "Invalid request", error }, { status: 400 });
  }
}

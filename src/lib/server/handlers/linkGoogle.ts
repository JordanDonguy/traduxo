import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/server/auth/authOptions";
import type { PrismaClient } from "@prisma/client/extension";

export async function linkGoogle(
  {
    getSessionFn,
    prismaClient,
  }: {
    getSessionFn: typeof getServerSession;
    prismaClient: Partial<PrismaClient>;
  }
) {
  // 1. Get user session
  const session = await getSessionFn(authOptions);

  // 2. If no session, return 401 Unauthorized
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 3. Insert a Date in the google_linking column
    await prismaClient.user.update({
      where: { email: session.user.email },
      data: { google_linking: new Date().toISOString() },
    });

    // 4. Respond with success
    return NextResponse.json({ message: "Google linking started" }, { status: 200 });

  } catch (err) {
    // 5. Handle unexpected Prisma/database errors
    console.error("Prisma update error:", err);
    return NextResponse.json({ error: "Database update failed" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const res = NextResponse;

  // Get session
  const session = await getServerSession(authOptions);

  // If no session, return 401
  if (!session?.user?.email) {
    return res.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Insert a Date in google_linking column 
    await prisma.user.update({
      where: { email: session.user.email },
      data: { google_linking: new Date().toISOString() },
    });

    return res.json({ message: "Google linking started" }, { status: 200 });
  } catch (err) {
    console.error("Prisma update error:", err);
    return res.json({ error: "Database update failed" }, { status: 500 });
  }
}

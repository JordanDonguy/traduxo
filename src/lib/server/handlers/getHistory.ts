import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client/extension";
import authOptions from "../auth/authOptions";
import { NextResponse } from "next/server";

export async function getHistory(
  {
    getSessionFn,
    prismaClient
  }: {
    getSessionFn: typeof getServerSession;
    prismaClient: Partial<PrismaClient>;
  }
) {
  try {
    // Get user session from NextAuth
    const session = await getSessionFn(authOptions);

    // Reject if user is not authenticated
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user history of translations
    const history = await prismaClient.history.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Return empty with 204 No Content
    if (!history || history.length === 0) {
      return new NextResponse(null, { status: 204 });
    }

    // Return history array
    return NextResponse.json(history, { status: 200 });

  } catch (error) {
    console.error("Error fetching history:", error);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}

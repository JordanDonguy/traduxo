import { PrismaClient } from "@prisma/client/extension";
import { NextResponse } from "next/server";
import { checkAuth } from "../../middlewares/checkAuth";

export async function getHistory(
  req: Request,
  {
    prismaClient
  }: {
    prismaClient: Partial<PrismaClient>;
  }
) {
  try {
    // 1. Authenticate user (web or mobile)
    const auth = await checkAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id: userId } = auth.user;

    // 2. Get user history of translations
    const history = await prismaClient.history.findMany({
      where: {
        userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // 3. Return empty with 204 No Content
    if (!history || history.length === 0) {
      return new NextResponse(null, { status: 204 });
    }

    // 4. Return history array
    return NextResponse.json(history, { status: 200 });

  } catch (error) {
    console.error("Error fetching history:", error);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}

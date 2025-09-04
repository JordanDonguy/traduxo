import { PrismaClient } from "@prisma/client/extension";
import { NextResponse } from "next/server";
import { checkAuth } from "../../middlewares/checkAuth";

export async function getFavorites(
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


    // 2. Get user favorites
    const favorites = await prismaClient.favorite.findMany({
      where: {
        userId
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // 3. Return empty with 204 No Content if no favorites
    if (!favorites || favorites.length === 0) {
      return new NextResponse(null, { status: 204 });
    }

    // 4. Return favorites array
    return NextResponse.json(favorites, { status: 200 });

  } catch (error) {
    console.error("Error fetching favorites:", error);
    return NextResponse.json({ error: "Failed to fetch favorites" }, { status: 500 });
  }
}

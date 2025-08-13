import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client/extension";
import authOptions from "../auth/authOptions";
import { NextResponse } from "next/server";

export async function getFavorites(
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

    // Get user favorites
    const favorites = await prismaClient.favorite.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Return empty with 204 No Content if no favorites
    if (!favorites || favorites.length === 0) {
      return new NextResponse(null, { status: 204 });
    }

    // Return favorites array
    return NextResponse.json(favorites, { status: 200 });

  } catch (error) {
    console.error("Error fetching favorites:", error);
    return NextResponse.json({ error: "Failed to fetch favorites" }, { status: 500 });
  }
}

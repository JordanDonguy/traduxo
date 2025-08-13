import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client/extension";
import authOptions from "../auth/authOptions";
import { NextResponse } from "next/server";

export async function deleteFromFavorite(
  req: Request,
  {
    getSessionFn,
    prismaClient,
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

    // Parse the request body JSON for the id of translation to delete
    const { id } = await req.json();

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Invalid or missing favorite id" },
        { status: 400 }
      );
    }

    // Verify that the favorite exists and belongs to the user
    const favorite = await prismaClient.favorite.findUnique({
      where: { id },
    });

    if (!favorite || favorite.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Favorite not found or unauthorized" },
        { status: 404 }
      );
    }

    // Delete the favorite by id
    await prismaClient.favorite.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("deleteFromFavorite error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

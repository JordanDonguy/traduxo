import { PrismaClient } from "@prisma/client/extension";
import { NextResponse } from "next/server";
import { checkAuth } from "../../middlewares/checkAuth";

export async function deleteFromFavorite(
  req: Request,
  {
    prismaClient,
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

    // 2. Parse the request body JSON for the id of translation to delete
    const { id } = await req.json();

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Invalid or missing favorite id" },
        { status: 400 }
      );
    }

    // 3. Verify that the favorite exists and belongs to the user
    const favorite = await prismaClient.favorite.findUnique({
      where: { id },
    });

    if (!favorite || favorite.userId !== userId) {
      return NextResponse.json(
        { error: "Favorite not found or unauthorized" },
        { status: 404 }
      );
    }

    // 4. Delete the favorite by id
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

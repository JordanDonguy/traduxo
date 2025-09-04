import { PrismaClient } from "@prisma/client/extension";
import { NextResponse } from "next/server";
import { checkAuth } from "../../middlewares/checkAuth";

export async function deleteFromHistory(
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
        { error: "Invalid or missing translation id" },
        { status: 400 }
      );
    }

    // 3. Verify that the translation exists and belongs to the user
    const translation = await prismaClient.history.findUnique({
      where: { id },
    });

    if (!translation || translation.userId !== userId) {
      return NextResponse.json(
        { error: "Translation not found or unauthorized" },
        { status: 404 }
      );
    }

    // 4. Delete the translation by id
    await prismaClient.history.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("deleteFromHistory error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client/extension";
import authOptions from "../auth/authOptions";
import { NextResponse } from "next/server";

export async function deleteFromHistory(
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
        { error: "Invalid or missing translation id" },
        { status: 400 }
      );
    }

    // Verify that the translation exists and belongs to the user
    const translation = await prismaClient.history.findUnique({
      where: { id },
    });

    if (!translation || translation.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Translation not found or unauthorized" },
        { status: 404 }
      );
    }

    // Delete the translation by id
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

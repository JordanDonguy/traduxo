import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client/extension";
import authOptions from "../auth/authOptions";
import { NextResponse } from "next/server";
import { translationRequestSchema } from "@/lib/shared/schemas";

const MAX_HISTORY = 100;

export async function saveTranslation(
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

    // Input validation with Zod
    const validation = translationRequestSchema.safeParse(await req.json());
    if (!validation.success) {
      const errors = validation.error.issues.map(issue => ({
        path: issue.path.join("."),
        message: issue.message,
      }));
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { translations, inputLang, outputLang } = validation.data;

    // Count user's current history entries
    const count = await prismaClient.history.count({
      where: { userId: session.user.id },
    });

    // If limit reached, delete oldest record(s) to make space
    if (count >= MAX_HISTORY) {
      const toDelete = count - MAX_HISTORY + 1; // number of records to delete
      await prismaClient.history.deleteMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "asc" },
        take: toDelete,
      });
    }

    // Save the new translation record to user history
    await prismaClient.history.create({
      data: {
        userId: session.user.id,
        inputText: translations[0] ?? "",
        translation: translations[1] ?? "",
        alt1: translations[2] ?? null,
        alt2: translations[3] ?? null,
        alt3: translations[4] ?? null,
        inputLang,
        outputLang,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("saveTranslation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

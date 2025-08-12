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
    const session = await getSessionFn(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const validation = translationRequestSchema.safeParse(await req.json());
    if (!validation.success) {
      const errors = validation.error.issues.map(issue => ({
        path: issue.path.join("."),
        message: issue.message,
      }));
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { translations, inputLang, outputLang } = validation.data;

    // Add new translation first
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

    // Count total history after insert
    const count = await prismaClient.history.count({
      where: { userId: session.user.id },
    });

    // If count exceeded, delete oldest record
    if (count > MAX_HISTORY) {
      await prismaClient.$queryRaw`
        DELETE FROM "History"
        WHERE id = (
          SELECT id FROM "History"
          WHERE "userId" = CAST(${session.user.id} AS uuid)
          ORDER BY "createdAt" ASC
          LIMIT 1
        )
      `;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("saveTranslation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


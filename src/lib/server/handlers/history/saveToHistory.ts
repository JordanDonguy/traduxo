import { PrismaClient } from "@prisma/client/extension";
import { NextResponse } from "next/server";
import { translationRequestSchema } from "@/lib/shared/schemas";
import { checkAuth } from "../../middlewares/checkAuth";

const MAX_HISTORY = 100;

export async function saveToHistory(
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

    // Req body validation with Zod schema
    const validation = translationRequestSchema.safeParse(await req.json());
    if (!validation.success) {
      const errors = validation.error.issues.map(issue => ({
        path: issue.path.join("."),
        message: issue.message,
      }));
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { translations, inputLang, outputLang } = validation.data;

    // Extract values by type
    const getValue = (type: string) =>
      translations.find(t => t.type === type)?.value ?? null;

    const mainExpression = getValue("expression");
    const mainTranslation = getValue("main_translation");

    // Check minimum required translations
    if (!mainExpression || !mainTranslation) {
      return NextResponse.json(
        {
          error: [
            {
              path: "translations",
              message: "At least one expression and one main_translation required",
            },
          ],
        },
        { status: 400 }
      );
    }

    const alternativeItems = translations.filter(t => t.type === "alternative");

    const res = await prismaClient.history.create({
      data: {
        userId,
        inputText: mainExpression,
        translation: mainTranslation,
        alt1: alternativeItems[0]?.value ?? null,
        alt2: alternativeItems[1]?.value ?? null,
        alt3: alternativeItems[2]?.value ?? null,
        inputLang,
        outputLang,
      },
    });

    // Count total history after insert
    const count = await prismaClient.history.count({
      where: { userId },
    });

    // If count exceeded, delete oldest record
    if (count > MAX_HISTORY) {
      await prismaClient.$queryRaw`
        DELETE FROM "History"
        WHERE id = (
          SELECT id FROM "History"
          WHERE "userId" = CAST(${userId} AS uuid)
          ORDER BY "createdAt" ASC
          LIMIT 1
        )
      `;
    }

    return NextResponse.json({ success: true, data: res });
  } catch (error) {
    console.error("saveToHistory error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

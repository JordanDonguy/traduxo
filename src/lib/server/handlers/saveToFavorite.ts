import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client/extension";
import authOptions from "../auth/authOptions";
import { NextResponse } from "next/server";
import { translationRequestSchema } from "@/lib/shared/schemas";
import { TranslationItem } from "../../../../types/translation";

export async function saveToFavorite(
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

    // Helper to get value by type
    const getValue = (type: string) =>
      translations.find((t: TranslationItem) => t.type === type)?.value ?? null;

    const mainExpression = getValue("expression");
    const mainTranslation = getValue("main_translation");

    // Check minimum required translations
    if (!mainExpression || !mainTranslation) {
      return NextResponse.json(
        { error: [{ path: "translations", message: "At least one expression and one main_translation required" }] },
        { status: 400 }
      );
    }

    const alternativeItems = translations.filter((t: TranslationItem) => t.type === "alternative");

    const favorite = await prismaClient.favorite.create({
      data: {
        userId: session.user.id,
        inputText: mainExpression,
        translation: mainTranslation,
        alt1: alternativeItems[0]?.value ?? null,
        alt2: alternativeItems[1]?.value ?? null,
        alt3: alternativeItems[2]?.value ?? null,
        inputLang,
        outputLang,
      },
    });

    return NextResponse.json({ id: favorite.id, success: true });
  } catch (error) {
    console.error("saveToFavorite error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

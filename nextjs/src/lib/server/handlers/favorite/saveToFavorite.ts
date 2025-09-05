import { PrismaClient } from "@prisma/client/extension";
import { NextResponse } from "next/server";
import { translationRequestSchema } from "@/lib/shared/schemas/translation/translationRequest.schemas";
import { TranslationItem } from "@traduxo/packages/types";
import { checkAuth } from "../../middlewares/checkAuth";

export async function saveToFavorite(
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
      // Combine all error messages into one string
      const errorMessage = validation.error.issues
        .map(issue => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ");

      return NextResponse.json({ error: errorMessage }, { status: 400 });
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
        { error: "At least one expression and one main translation required" },
        { status: 400 }
      );
    }

    const alternativeItems = translations.filter((t: TranslationItem) => t.type === "alternative");

    const favorite = await prismaClient.favorite.create({
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

    return NextResponse.json({ id: favorite.id, success: true });
  } catch (error) {
    console.error("saveToFavorite error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

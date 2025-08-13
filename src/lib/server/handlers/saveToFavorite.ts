import { getServerSession } from "next-auth";
import { PrismaClient } from "@prisma/client/extension";
import authOptions from "../auth/authOptions";
import { NextResponse } from "next/server";
import { translationRequestSchema } from "@/lib/shared/schemas";

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

    const favorite = await prismaClient.favorite.create({
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

    return NextResponse.json({ id: favorite.id, success: true });
  } catch (error) {
    console.error("saveToFavorite error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

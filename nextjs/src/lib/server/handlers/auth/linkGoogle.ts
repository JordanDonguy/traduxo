import { NextResponse } from "next/server";
import type { PrismaClient } from "@prisma/client/extension";
import bcrypt from "bcrypt";
import sanitizeHtml from "sanitize-html";
import { loginSchema } from "@/lib/shared/schemas/auth/login.schemas";
import { generateToken } from "@/lib/server/auth/generateToken";

export async function linkGoogle(
  req: Request,
  {
    prismaClient,
  }: {
    prismaClient: Partial<PrismaClient>;
  }) {
  try {
    const body = await req.json();

    // 1. Validate input with Zod
    const parsed = loginSchema.safeParse({
      email: sanitizeHtml(body.email),
      password: sanitizeHtml(body.password),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    // 2. Fetch user from DB
    const user = await prismaClient.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // 3. Check password
    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return NextResponse.json(
        { error: "Incorrect password." },
        { status: 401 }
      );
    }

    // 4. Check google_linking timestamp
    const now = new Date();
    const linkingDate = user.google_linking ? new Date(user.google_linking) : null;

    if (!linkingDate || now.getTime() - linkingDate.getTime() > 10 * 60 * 1000) {
      return NextResponse.json(
        { error: "For security, Google linking requests expire after 10 minutes. Please sign in with Google again to restart the process." },
        { status: 400 }
      );
    }

    // 5. Add Google provider
    const updatedUser = await prismaClient.user.update({
      where: { email },
      data: {
        providers: {
          push: "Google",
        },
        google_linking: null, // reset linking timestamp
      },
    });

    // 6. Generate JWT tokens
    const tokens = await generateToken({
      userId: updatedUser.id,
      email: updatedUser.email,
      language: updatedUser.systemLang || null,
      providers: updatedUser.providers,
      accessTokenExpiresIn: "1h",
      refreshTokenExpiryDays: 30,
    });

    // 7. Return tokens
    return NextResponse.json(tokens, { status: 200 });
  } catch (err) {
    console.error("Error linking Google account:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

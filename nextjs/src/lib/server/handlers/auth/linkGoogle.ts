import { NextRequest, NextResponse } from "next/server";
import type { PrismaClient } from "@prisma/client/extension";
import bcrypt from "bcrypt";
import sanitizeHtml from "sanitize-html";
import { loginSchema } from "@/lib/shared/schemas/auth/login.schemas";
import { generateToken } from "@/lib/server/auth/generateToken";
import { TokenResult } from "@traduxo/packages/types/token";

export async function linkGoogle(
  req: NextRequest,
  { prismaClient }: { prismaClient: Partial<PrismaClient> }
) {
  try {
    const isNative = req.headers.get("x-client") === "native";
    const body = await req.json();

    // 1. Validate input
    const parsed = loginSchema.safeParse({
      email: sanitizeHtml(body.email),
      password: sanitizeHtml(body.password),
    });

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 400 });
    }

    const { email, password } = parsed.data;

    // 2. Fetch user
    const user = await prismaClient.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

    // 3. Check password
    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) return NextResponse.json({ error: "Incorrect password." }, { status: 401 });

    // 4. Validate linking timestamp
    const now = new Date();
    const linkingDate = user.google_linking ? new Date(user.google_linking) : null;
    if (!linkingDate || now.getTime() - linkingDate.getTime() > 10 * 60 * 1000) {
      return NextResponse.json({
        error: "For security, Google linking requests expire after 10 minutes. Please sign in with Google again to restart the process.",
      }, { status: 400 });
    }

    // 5. Add Google provider
    const updatedUser = await prismaClient.user.update({
      where: { email },
      data: { providers: { push: "Google" }, google_linking: null },
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

    // 7. Build response body
    const responseBody: TokenResult = {
      token: tokens.accessToken,
      language: user.systemLang,
      providers: user.providers,
    };

    if (isNative) {
      // Include refresh token for native
      responseBody.refreshToken = tokens.refreshToken;
      return NextResponse.json(responseBody, { status: 200 });
    } else {
      // Set cookie for web
      const response = NextResponse.json(responseBody, { status: 200 });
      response.cookies.set("refreshToken", tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
      return response;
    }
  } catch (err) {
    console.error("Error linking Google account:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

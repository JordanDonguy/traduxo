import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/server/prisma";
import { generateToken } from "@/lib/server/auth/generateToken";
import { TokenResult } from "@traduxo/packages/types/token";

export async function refreshTokenHandler(req: NextRequest) {
  try {
    // 1. Determine platform: RN sends "x-client: native" header
    const isNative = req.headers.get("x-client") === "native";

    // 2. Get refresh token
    let refreshToken: string | undefined;
    if (isNative) {
      const body = await req.json();
      refreshToken = body.refreshToken
    } else {
      refreshToken = req.cookies.get("refreshToken")?.value;
    }

    if (!refreshToken) {
      return NextResponse.json({ error: "Missing refresh token" }, { status: 400 });
    }

    // 3. Find and validate refresh token in DB
    const tokenRecords = await prisma.refreshToken.findMany({
      where: { expiresAt: { gt: new Date() }, revoked: false },
    });

    const tokenRecord = tokenRecords.find((t) => bcrypt.compareSync(refreshToken, t.token));
    if (!tokenRecord) {
      return NextResponse.json({ error: "Invalid or expired refresh token" }, { status: 401 });
    }

    // 4. Fetch user info
    const user = await prisma.user.findUnique({ where: { id: tokenRecord.userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // 5. Generate new tokens
    const tokens = await generateToken({
      userId: user.id,
      email: user.email,
      language: user.systemLang,
      providers: user.providers,
      prismaClient: prisma,
      cryptoFn: crypto,
      bcryptFn: bcrypt,
      jwtFn: jwt,
      accessTokenExpiresIn: "1h",
      refreshTokenExpiryDays: 30,
      oldRefreshToken: refreshToken,
    });

    // 6. Build response body
    const responseBody: TokenResult = {
      token: tokens.accessToken,
      language: user.systemLang ?? undefined,
      providers: user.providers,
    };

    if (isNative) {
      // Native: include refresh token in JSON
      responseBody.refreshToken = tokens.refreshToken;
      return NextResponse.json(responseBody, { status: 200 });
    } else {
      // Web: set HTTP-only cookie for refresh token
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
    console.error("JWT refresh error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

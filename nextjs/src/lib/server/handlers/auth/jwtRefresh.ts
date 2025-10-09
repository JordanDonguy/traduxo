import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/server/prisma";
import { generateToken } from "@/lib/server/auth/generateToken";
import { TokenResult } from "@traduxo/packages/types/token";

const REFRESH_ROTATE_THRESHOLD_MS = 1000 * 60 * 60 * 24; // 1 day

export async function refreshTokenHandler(req: NextRequest) {
  try {
    const isNative = req.headers.get("x-client") === "native";

    // 1. Get refresh token
    let refreshToken: string | undefined;
    if (isNative) {
      const body = await req.json();
      refreshToken = body.refreshToken;
    } else {
      refreshToken = req.cookies.get("refreshToken")?.value;
    }

    if (!refreshToken) {
      return NextResponse.json({ error: "Missing refresh token" }, { status: 400 });
    }

    // 2. Find valid refresh token
    const tokenRecords = await prisma.refreshToken.findMany({
      where: { expiresAt: { gt: new Date() }, revoked: false },
    });

    const tokenRecord = tokenRecords.find((t) => bcrypt.compareSync(refreshToken, t.token));
    if (!tokenRecord) {
      return NextResponse.json({ error: "Invalid or expired refresh token" }, { status: 401 });
    }

    // 3. Fetch user info
    const user = await prisma.user.findUnique({ where: { id: tokenRecord.userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const now = Date.now();
    const tokenAge = now - tokenRecord.createdAt.getTime();

    let tokens = { accessToken: "", refreshToken: refreshToken };

    // 4. Generate a new refresh token if needed
    if (tokenAge > REFRESH_ROTATE_THRESHOLD_MS) {
      // Rotate refresh token
      tokens = await generateToken({
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
    } else {
      // Only generate new access token, keep same refresh token
      tokens.accessToken = jwt.sign(
        { sub: user.id, email: user.email, language: user.systemLang, providers: user.providers },
        process.env.JWT_SECRET!,
        { expiresIn: "1h" }
      );
    }

    // 5. Build response body
    const responseBody: TokenResult = {
      token: tokens.accessToken,
      language: user.systemLang ?? undefined,
      providers: user.providers,
    };

    if (isNative) {
      responseBody.refreshToken = tokens.refreshToken;
      return NextResponse.json(responseBody, { status: 200 });
    } else {
      const response = NextResponse.json(responseBody, { status: 200 });
      response.cookies.set("refreshToken", tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
      return response;
    }
  } catch (err) {
    console.error("JWT refresh error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

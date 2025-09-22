import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/server/prisma";
import { PrismaClient } from "@prisma/client/extension";
import { generateToken } from "@/lib/server/auth/generateToken";

export interface RefreshTokenDeps {
  prismaClient?: Partial<PrismaClient>;
  bcryptFn?: typeof bcrypt;
  cryptoFn?: typeof crypto;
  jwtFn?: typeof jwt;
}

export async function refreshTokenHandler(
  req: NextRequest,
  { prismaClient = prisma, bcryptFn = bcrypt, cryptoFn = crypto, jwtFn = jwt }: RefreshTokenDeps
) {
  try {
    const { refreshToken, accessToken } = await req.json();

    if (!refreshToken) {
      return NextResponse.json({ error: "Missing refresh token" }, { status: 400 });
    }

    if (!accessToken) {
      return NextResponse.json({ error: "Missing access token" }, { status: 400 });
    }

    let userId: string | null = null;

    try {
      // Verify signature, ignore expiration
      const decoded = jwtFn.verify(accessToken, process.env.JWT_SECRET!, {
        ignoreExpiration: true,
      }) as jwt.JwtPayload;

      userId = decoded.sub as string;
    } catch {
      // Fallback: decode without verifying
      const decoded = jwtFn.decode(accessToken) as jwt.JwtPayload | null;
      if (decoded?.sub) {
        userId = decoded.sub as string;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Invalid access token" }, { status: 401 });
    }

    // 1. Find refresh tokens only for that user
    const tokenRecords = await prismaClient.refreshToken.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
    });

    // 2. Compare against provided refresh token
    let tokenRecord: typeof tokenRecords[number] | null = null;
    for (const record of tokenRecords) {
      const isMatch = await bcryptFn.compare(refreshToken, record.token);
      if (isMatch) {
        tokenRecord = record;
        break;
      }
    }

    if (!tokenRecord) {
      return NextResponse.json({ error: "Invalid or expired refresh token" }, { status: 401 });
    }

    // 2. Fetch user info
    const user = await prismaClient.user.findUnique({
      where: { id: tokenRecord.userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 3. Generate new access + refresh tokens
    const tokens = await generateToken({
      userId: user.id,
      email: user.email,
      language: user.systemLang,
      providers: user.providers,
      prismaClient: prisma,
      cryptoFn,
      bcryptFn,
      jwtFn,
      accessTokenExpiresIn: "1h",
      refreshTokenExpiryDays: 30,
      oldRefreshToken: refreshToken
    });

    return NextResponse.json(tokens);
  } catch (err) {
    console.error("JWT refresh error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

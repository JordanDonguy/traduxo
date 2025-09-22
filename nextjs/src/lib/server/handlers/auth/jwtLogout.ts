import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/server/prisma";
import { PrismaClient } from "@prisma/client/extension";

export interface LogoutDeps {
  prismaClient?: Partial<PrismaClient>;
  bcryptFn?: typeof bcrypt;
  jwtFn?: typeof jwt;
}

interface LogoutBody {
  refreshToken: string;
  accessToken: string;
}

interface RefreshTokenRecord {
  id: string;
  token: string;
}

export async function jwtLogoutHandler(
  req: NextRequest,
  { prismaClient = prisma, bcryptFn = bcrypt, jwtFn = jwt }: LogoutDeps
) {
  try {
    const body: LogoutBody = await req.json();
    const { refreshToken, accessToken } = body;

    if (!refreshToken || !accessToken) {
      return NextResponse.json({ error: "Missing refreshToken or accessToken" }, { status: 400 });
    }

    // Decode access token to get userId
    let userId: string | null = null;
    try {
      const decoded = jwtFn.verify(accessToken, process.env.JWT_SECRET!, { ignoreExpiration: true }) as jwt.JwtPayload;
      userId = decoded.sub as string;
    } catch {
      const decoded = jwtFn.decode(accessToken) as jwt.JwtPayload | null;
      userId = decoded?.sub ?? null;
    }

    if (!userId) {
      return NextResponse.json({ error: "Invalid access token" }, { status: 401 });
    }

    // Find all active refresh tokens for this user
    const tokens = await prismaClient.refreshToken.findMany({
      where: { userId, expiresAt: { gt: new Date() } },
      select: { id: true, token: true },
    });

    // Find matching token
    const tokenToRevoke = tokens.find((t: RefreshTokenRecord) =>
      bcryptFn.compareSync(refreshToken, t.token)
    );

    if (tokenToRevoke) {
      await prismaClient.refreshToken.update({
        where: { id: tokenToRevoke.id },
        data: { revoked: true },
      });
    }

    return NextResponse.json({ success: true, message: "Logged out" });
  } catch (err) {
    console.error("JWT logout error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

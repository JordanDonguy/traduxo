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
    // 1. Determine platform: RN sends "x-client: native" header
    const isNative = req.headers.get("x-client") === "native";

    // 2. Pick refresh token
    let refreshToken: string | undefined;
    let accessToken: string | undefined;

    if (isNative) {
      const body: Partial<LogoutBody> = await req.json();
      refreshToken = body.refreshToken;
      accessToken = body.accessToken;
    } else {
      refreshToken = req.cookies.get("refreshToken")?.value;
      const body: Partial<LogoutBody> = await req.json();
      accessToken = body.accessToken; // web still sends accessToken
    }

    if (!refreshToken || !accessToken) {
      return NextResponse.json(
        { error: "Missing refreshToken or accessToken" },
        { status: 400 }
      );
    }

    // 3. Decode access token to get userId
    let userId: string | null = null;
    try {
      const decoded = jwtFn.verify(accessToken, process.env.JWT_SECRET!, { ignoreExpiration: true }) as jwt.JwtPayload;
      userId = decoded.sub as string;
    } catch {
      const decoded = jwtFn.decode(accessToken) as jwt.JwtPayload | null;
      userId = decoded?.sub ?? null;
    }

    if (!userId) return NextResponse.json({ error: "Invalid access token" }, { status: 401 });

    // 4. Find active refresh tokens for this user
    const tokens = await prismaClient.refreshToken.findMany({
      where: { userId, expiresAt: { gt: new Date() } },
      select: { id: true, token: true },
    });

    // 5. Revoke the matching token
    const tokenToRevoke = tokens.find((t: RefreshTokenRecord) =>
      bcryptFn.compareSync(refreshToken!, t.token)
    );

    if (tokenToRevoke) {
      await prismaClient.refreshToken.update({
        where: { id: tokenToRevoke.id },
        data: { revoked: true },
      });
    }

    // 6. Clear the cookie in response (web)
    const response = NextResponse.json({ success: true, message: "Logged out" });
    if (!isNative) {
      response.cookies.set("refreshToken", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 0, // immediately expire
      });
    }

    return response;
  } catch (err) {
    console.error("JWT logout error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

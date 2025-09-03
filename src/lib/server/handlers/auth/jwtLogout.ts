import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client/extension";
import { prisma } from "@/lib/server/prisma";
import bcrypt from "bcrypt";



interface LogoutBody {
  refreshToken: string;
}

export interface JwtLogoutDeps {
  prismaClient?: Partial<PrismaClient>;
  bcryptFn?: Partial<typeof bcrypt>;
}

export async function jwtLogoutHandler(
  req: NextRequest,
  { prismaClient = prisma, bcryptFn = bcrypt }: JwtLogoutDeps
) {
  try {
    const body: LogoutBody = await req.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json({ error: "Missing refresh token" }, { status: 400 });
    }

    // Find all hashed tokens in DB
    const tokens: { id: string; token: string }[] = await prismaClient.refreshToken.findMany({
      select: { id: true, token: true },
    });

    // Compare each hashed token with the one provided
    const tokenEntry = tokens.find((t) =>
      bcryptFn.compareSync!(refreshToken, t.token)
    );

    if (tokenEntry) {
      await prismaClient.refreshToken.delete({ where: { id: tokenEntry.id } });
    }

    return NextResponse.json({ success: true, message: "Logged out" });
  } catch (err) {
    console.error("JWT logout error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

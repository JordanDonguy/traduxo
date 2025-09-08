// lib/server/handlers/auth/refreshTokenHandler.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client/extension";
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";

export interface RefreshTokenDeps {
  prismaClient: Partial<PrismaClient>;
  bcryptFn?: typeof bcrypt;
  cryptoFn?: typeof crypto;
  jwtFn?: typeof jwt;
}

export async function refreshTokenHandler(
  req: NextRequest,
  { prismaClient, bcryptFn = bcrypt, cryptoFn = crypto, jwtFn = jwt }: RefreshTokenDeps
) {
  const { refreshToken } = await req.json();

  if (!refreshToken) {
    return NextResponse.json({ error: "Missing refresh token" }, { status: 400 });
  }

  // Find unexpired refresh token in DB
  const tokenRecord = await prismaClient.refreshToken.findFirst({
    where: { expiresAt: { gt: new Date() } },
  });

  if (!tokenRecord) {
    return NextResponse.json({ error: "Invalid or expired refresh token" }, { status: 401 });
  }

  const isValid = await bcryptFn.compare(refreshToken, tokenRecord.token);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });
  }

  // Fetch user to include language and providers in JWT
  const user = await prismaClient.user.findUnique({
    where: { id: tokenRecord.userId },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const newAccessToken = jwtFn.sign(
    {
      sub: user.id,
      email: user.email,
      language: user.systemLang,
      providers: user.providers,
    },
    process.env.JWT_SECRET!,
    { expiresIn: "1h" }
  );

  // Generate new refresh token
  const newRefreshToken = cryptoFn.randomBytes(64).toString("hex");
  const hashedToken = await bcryptFn.hash(newRefreshToken, 10);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  await prismaClient.refreshToken.create({
    data: { token: hashedToken, userId: user.id, expiresAt },
  });

  // Delete old refresh token
  await prismaClient.refreshToken.delete({ where: { id: tokenRecord.id } });

  return NextResponse.json({
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    expiresIn: 3600,
  });
}

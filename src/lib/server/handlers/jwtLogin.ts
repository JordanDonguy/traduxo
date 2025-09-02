import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { PrismaClient } from "@prisma/client/extension";
import { authorizeUser } from "@/lib/server/auth/authorizeUser";
import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const runtime = "edge";

// Relax types for DI
export interface JwtLoginDeps {
  authorizeUserFn: typeof authorizeUser;
  prismaClient: Partial<PrismaClient>;
  cryptoFn?: Pick<typeof crypto, "randomBytes">;
  bcryptFn?: Pick<typeof bcrypt, "hash">;
  jwtFn?: Pick<typeof jwt, "sign">;
}

export async function jwtLoginHandler(
  req: NextRequest,
  {
    authorizeUserFn = authorizeUser,
    prismaClient = prisma,
    cryptoFn = crypto,
    bcryptFn = bcrypt,
    jwtFn = jwt,
  }: Partial<JwtLoginDeps>
) {
  const body = await req.json();
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
  }

  const user = await authorizeUserFn({ email, password });
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const accessToken = jwtFn.sign(
    { sub: user.id, email: user.email },
    process.env.JWT_SECRET!,
    { expiresIn: "1h" }
  );

  const refreshToken = cryptoFn.randomBytes(64).toString("hex");
  const hashedToken = await bcryptFn.hash(refreshToken, 10);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  await prismaClient.refreshToken.create({
    data: { token: hashedToken, userId: user.id, expiresAt },
  });

  return NextResponse.json({
    accessToken,
    refreshToken,
    expiresIn: 3600,
  });
}

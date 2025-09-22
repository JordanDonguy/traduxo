import { prisma } from "@/lib/server/prisma";
import { PrismaClient } from "@prisma/client/extension";
import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";

export interface GenerateTokenOptions {
  userId: string;
  email: string;
  language?: string | null;
  providers?: string[];
  prismaClient?: Partial<PrismaClient>;
  cryptoFn?: Pick<typeof crypto, "randomBytes">;
  bcryptFn?: typeof bcrypt;
  jwtFn?: Pick<typeof jwt, "sign">;
  accessTokenExpiresIn?: string | number; // e.g., "1h" or 3600
  refreshTokenExpiryDays?: number; // default 30
  oldRefreshToken?: string;
}

export async function generateToken({
  userId,
  email,
  language,
  providers,
  prismaClient = prisma,
  cryptoFn = crypto,
  bcryptFn = bcrypt,
  jwtFn = jwt,
  accessTokenExpiresIn = "1h",
  refreshTokenExpiryDays = 30,
  oldRefreshToken,
}: GenerateTokenOptions) {
  // 1. Create JWT access token
  const accessToken = jwtFn.sign(
    { sub: userId, email, language, providers },
    process.env.JWT_SECRET!,
    { expiresIn: accessTokenExpiresIn } as SignOptions
  );

  // 2. Create refresh token
  const refreshToken = cryptoFn.randomBytes(64).toString("hex");
  const hashedToken = await bcryptFn.hash(refreshToken, 10);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + refreshTokenExpiryDays);

  // 3. Optionally revoke old refresh token
  if (oldRefreshToken) {
    const tokenRecords = await prismaClient.refreshToken.findMany({
      where: { userId, revoked: false },
    });

    for (const record of tokenRecords) {
      const isMatch = await bcryptFn.compare(oldRefreshToken, record.token);
      if (isMatch) {
        await prismaClient.refreshToken.update({
          where: { id: record.id },
          data: { revoked: true },
        });
        break;
      }
    }
  }

  // 4. Store new refresh token
  await prismaClient.refreshToken.create({
    data: { token: hashedToken, userId, expiresAt, revoked: false },
  });

  return {
    accessToken,
    refreshToken,
    expiresIn:
      typeof accessTokenExpiresIn === "number" ? accessTokenExpiresIn : 3600,
  };
}

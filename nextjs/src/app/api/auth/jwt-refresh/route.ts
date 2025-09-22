// app/api/auth/refresh/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { refreshTokenHandler } from "@/lib/server/handlers/auth/jwtRefresh";

export async function POST(req: NextRequest) {
  return refreshTokenHandler(req, { prismaClient: prisma });
}

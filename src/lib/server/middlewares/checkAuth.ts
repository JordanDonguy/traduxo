// src/lib/server/middlewares/checkAuth.ts
import { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import authOptions from "@/lib/server/auth/authOptions";
import { prisma } from "@/lib/server/prisma";
import { validateJWTPayload } from "./utils/validateJwtPayload";
import { getServerSession } from "next-auth";

const JWT_SECRET = process.env.JWT_SECRET;

export async function checkAuth(
  req: Request | NextRequest,
  {
    getSessionFn = getServerSession
  }: {
    getSessionFn?: typeof getServerSession;
  } = {}
): Promise<{ user: { id: string; email: string } } | null> {
  try {
    // 1️⃣ Try NextAuth session (web users)
    const session = await getSessionFn(authOptions);
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, email: true },
      });
      return user ? { user } : null;
    }

    // 2️⃣ Try JWT Bearer token (mobile users)
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;

    const token = authHeader.split(" ")[1];
    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
    if (!payload) return null;

    const user = validateJWTPayload(payload);
    if (!user) return null;

    return { user };
  } catch (error) {
    console.error("Auth middleware error:", error);
    return null;
  }
}

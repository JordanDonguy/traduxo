import { jwtLogoutHandler } from "@/lib/server/handlers/auth/jwtLogout";
import { prisma } from "@/lib/server/prisma";
import { NextRequest } from "next/server";

// -------------- Route handler --------------
export async function POST(req: NextRequest) {
  return jwtLogoutHandler(req, {
    prismaClient: prisma,
  });
}

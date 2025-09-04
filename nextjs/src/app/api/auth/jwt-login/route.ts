import { jwtLoginHandler } from "@/lib/server/handlers/auth/jwtLogin";
import { authorizeUser } from "@/lib/server/auth/authorizeUser";
import { prisma } from "@/lib/server/prisma";
import { NextRequest } from "next/server";

// -------------- Route handler --------------
export async function POST(req: NextRequest) {
  return jwtLoginHandler(req, {
    authorizeUserFn: authorizeUser,
    prismaClient: prisma,
  });
}

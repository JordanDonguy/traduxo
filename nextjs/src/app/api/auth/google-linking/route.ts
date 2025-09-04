import { prisma } from "@/lib/server/prisma";
import { linkGoogle } from "@/lib/server/handlers/auth/linkGoogle";
import { NextRequest } from "next/server";

// -------------- Route handler --------------
export async function POST(req: NextRequest) {
  return linkGoogle(req, {
    prismaClient: prisma,
  });
}

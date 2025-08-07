import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/server/prisma";
import { linkGoogle } from "@/lib/server/handlers/linkGoogle";

// -------------- Route handler --------------
export async function POST() {
  return linkGoogle({
    getSessionFn: getServerSession,
    prismaClient: prisma,
  });
}

import { getServerSession } from "next-auth/next";
import { prisma } from "@/lib/server/prisma";
import { deleteAccount } from "@/lib/server/handlers/deleteAccount";

// -------------- Route handler --------------
export async function DELETE() {
  return deleteAccount({
    getSessionFn: getServerSession,
    prismaClient: prisma,
  });
}

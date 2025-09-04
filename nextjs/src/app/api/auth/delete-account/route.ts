import { prisma } from "@/lib/server/prisma";
import { deleteAccount } from "@/lib/server/handlers/auth/deleteAccount";
import { NextRequest } from "next/server";

// -------------- Route handler --------------
export async function DELETE(req: NextRequest) {
  return deleteAccount(req, {
    prismaClient: prisma,
  });
}

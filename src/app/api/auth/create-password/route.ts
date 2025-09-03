import { NextRequest } from 'next/server';
import { prisma } from "@/lib/server/prisma";
import { createPassword } from "@/lib/server/handlers/auth/createPassword";

// -------------- Route handler --------------
export async function POST(req: NextRequest) {
  return createPassword(req, {
    prismaClient: prisma,
  });
}

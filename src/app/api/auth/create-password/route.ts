import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from "@/lib/server/prisma";
import { createPassword } from "@/lib/server/handlers/createPassword";

// -------------- Route handler --------------
export async function POST(req: NextRequest) {
  return createPassword(req, {
    getSessionFn: getServerSession,
    prismaClient: prisma,
  });
}

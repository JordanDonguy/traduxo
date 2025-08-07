import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/server/prisma';
import { updatePassword } from "@/lib/server/handlers/updatePassword";

// -------------- Route handler --------------
export async function POST(req: NextRequest) {
  return updatePassword(req, {
    getSessionFn: getServerSession,
    prismaClient: prisma,
  });
}

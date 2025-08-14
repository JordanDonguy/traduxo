import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/server/prisma';
import { updateLanguage } from "@/lib/server/handlers/updateLanguage";

// -------------- Route handler --------------
export async function POST(req: NextRequest) {
  return updateLanguage(req, {
    getSessionFn: getServerSession,
    prismaClient: prisma,
  });
}

import { NextRequest } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { updateLanguage } from "@/lib/server/handlers/auth/updateLanguage";

// -------------- Route handler --------------
export async function POST(req: NextRequest) {
  return updateLanguage(req, {
    prismaClient: prisma,
  });
}

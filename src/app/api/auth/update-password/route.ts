import { NextRequest } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { updatePassword } from "@/lib/server/handlers/auth/updatePassword";

// -------------- Route handler --------------
export async function POST(req: NextRequest) {
  return updatePassword(req, {
    prismaClient: prisma,
  });
}

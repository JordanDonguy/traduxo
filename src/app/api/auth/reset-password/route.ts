import { NextRequest } from 'next/server';
import { prisma } from '@/lib/server/prisma';
import { resetPassword } from "@/lib/server/handlers/resetPassword";

// -------------- Route handler --------------
export async function POST(req: NextRequest) {
  return resetPassword(req, {
    prismaClient: prisma,
  });
}

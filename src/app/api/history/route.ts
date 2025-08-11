import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from "@/lib/server/prisma";
import { saveTranslation } from "@/lib/server/handlers/saveTranslation";
import { getTranslations } from "@/lib/server/handlers/getTranslations";
import { deleteTranslation } from "@/lib/server/handlers/deleteTranslation";

// -------------- Route handler --------------
export async function POST(req: NextRequest) {
  return saveTranslation(req, {
    getSessionFn: getServerSession,
    prismaClient: prisma,
  });
}

export async function GET() {
  return getTranslations({
    getSessionFn: getServerSession,
    prismaClient: prisma,
  });
}

export async function DELETE(req: NextRequest) {
  return deleteTranslation(
    req, {
      getSessionFn: getServerSession,
      prismaClient: prisma
    }
  )
}

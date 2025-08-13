import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from "@/lib/server/prisma";
import { saveToFavorite } from "@/lib/server/handlers/saveToFavorite";
import { getFavorites } from "@/lib/server/handlers/getFavorites";
import { deleteFromFavorite } from "@/lib/server/handlers/deleteFromFavorite";

// -------------- Route handler --------------
export async function POST(req: NextRequest) {
  return saveToFavorite(req, {
    getSessionFn: getServerSession,
    prismaClient: prisma,
  });
}

export async function GET() {
  return getFavorites({
    getSessionFn: getServerSession,
    prismaClient: prisma,
  });
}

export async function DELETE(req: NextRequest) {
  return deleteFromFavorite(
    req, {
      getSessionFn: getServerSession,
      prismaClient: prisma
    }
  )
}

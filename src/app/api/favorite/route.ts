import { NextRequest } from 'next/server';
import { prisma } from "@/lib/server/prisma";
import { saveToFavorite } from "@/lib/server/handlers/favorite/saveToFavorite";
import { getFavorites } from "@/lib/server/handlers/favorite/getFavorites";
import { deleteFromFavorite } from "@/lib/server/handlers/favorite/deleteFromFavorite";

// -------------- Route handler --------------
export async function POST(req: NextRequest) {
  return saveToFavorite(req, {
    prismaClient: prisma,
  });
}

export async function GET(req: NextRequest) {
  return getFavorites(req, {
    prismaClient: prisma,
  });
}

export async function DELETE(req: NextRequest) {
  return deleteFromFavorite(
    req, {
      prismaClient: prisma
    }
  )
}

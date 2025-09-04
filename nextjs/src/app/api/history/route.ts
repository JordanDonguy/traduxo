import { NextRequest } from 'next/server';
import { prisma } from "@/lib/server/prisma";
import { saveToHistory } from "@/lib/server/handlers/history/saveToHistory";
import { getHistory } from "@/lib/server/handlers/history/getHistory";
import { deleteFromHistory } from "@/lib/server/handlers/history/deleteFromHistory";

// -------------- Route handler --------------
export async function POST(req: NextRequest) {
  return saveToHistory(req, {
    prismaClient: prisma,
  });
}

export async function GET(req: NextRequest) {
  return getHistory(req, {
    prismaClient: prisma,
  });
}

export async function DELETE(req: NextRequest) {
  return deleteFromHistory(
    req, {
      prismaClient: prisma
    }
  )
}

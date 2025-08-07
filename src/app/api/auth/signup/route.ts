// src/app/api/register/route.ts
import { NextRequest } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { signupHandler } from "@/lib/server/handlers/signup";

// -------------- Route handler --------------
export async function POST(req: NextRequest) {
  const body = await req.json();
  return signupHandler({ body, prismaClient: prisma });
}

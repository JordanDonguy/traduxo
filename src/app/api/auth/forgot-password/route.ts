import { NextRequest } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { forgotPassword } from "@/lib/server/handlers/auth/forgotPassword";
import { mailerSend } from "@/lib/server/mailerSend";

// -------------- Route handler --------------
export async function POST(req: NextRequest) {
  return forgotPassword(req, {
    prismaClient: prisma,
    mailerSendClient: mailerSend
  })
}

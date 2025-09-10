import { googleSignInHandler } from "@/lib/server/handlers/auth/googleLogin";
import { OAuth2Client } from "google-auth-library";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/server/prisma";


const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_APP_URL}/auth/google/callback`
);

// -------------- Route handler --------------
export async function POST(req: NextRequest) {
  return googleSignInHandler(req, { prismaClient: prisma, googleClient: client });
}

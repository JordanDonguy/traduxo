// googleLogin.ts
import { NextResponse } from "next/server";
import { generateToken } from "@/lib/server/auth/generateToken";
import { handleGoogleSignIn } from "@/lib/server/auth/handleGoogleSignIn";
import { PrismaClient } from "@prisma/client/extension";
import { OAuth2Client } from "google-auth-library";

export async function googleSignInHandler(
  req: Request,
  {
    prismaClient,
    googleClient,
  }: {
    prismaClient: Partial<PrismaClient>;
    googleClient: OAuth2Client;
  }
) {
  try {
    const { code } = await req.json();
    if (!code) return NextResponse.json({ error: "Missing authorization code" }, { status: 400 });

    const { tokens } = await googleClient.getToken(code);
    const idToken = tokens.id_token;
    if (!idToken) return NextResponse.json({ error: "No id_token in Google response" }, { status: 400 });

    const ticket = await googleClient.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID! });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) return NextResponse.json({ error: "Invalid Google token" }, { status: 400 });

    const result = await handleGoogleSignIn(payload.email, prismaClient);

    if (!result.success) {
      if (result.reason === "NeedGoogleLinking") return NextResponse.json({ error: "NeedGoogleLinking" }, { status: 400 });
      return NextResponse.json(result, { status: 500 });
    }

    const jwtTokens = await generateToken({
      userId: result.userId,
      email: payload.email,
      language: result.language || null,
      providers: result.providers || ["Google"],
      prismaClient,
      accessTokenExpiresIn: "1h",
      refreshTokenExpiryDays: 30,
    });

    return NextResponse.json(jwtTokens);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

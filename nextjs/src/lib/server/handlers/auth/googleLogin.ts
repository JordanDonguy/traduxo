import { NextRequest, NextResponse } from "next/server";
import { generateToken } from "@/lib/server/auth/generateToken";
import { handleGoogleSignIn } from "@/lib/server/auth/handleGoogleSignIn";
import { PrismaClient } from "@prisma/client/extension";
import { OAuth2Client } from "google-auth-library";
import { TokenResult } from "@traduxo/packages/types/token";

export async function googleSignInHandler(
  req: NextRequest,
  { prismaClient, googleClient }: { prismaClient: Partial<PrismaClient>; googleClient: OAuth2Client }
) {
  try {
    // 1. Extract authorization code from request body
    const { code } = await req.json();
    if (!code) return NextResponse.json({ error: "Missing authorization code" }, { status: 400 });

    // 2. Detect if the client is native (React Native) or web
    const isNative = req.headers.get("x-client") === "native";

    // 3. Exchange code for Google tokens
    const { tokens } = await googleClient.getToken(code);
    const idToken = tokens.id_token;
    if (!idToken) return NextResponse.json({ error: "No id_token in Google response" }, { status: 400 });

    // 4. Verify Google id_token and extract payload
    const ticket = await googleClient.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID! });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) return NextResponse.json({ error: "Invalid Google token" }, { status: 400 });

    // 5. Handle sign-in or linking logic in database
    const result = await handleGoogleSignIn(payload.email, prismaClient);
    if (!result.success) {
      if (result.reason === "NeedGoogleLinking") return NextResponse.json({ error: "NeedGoogleLinking" }, { status: 400 });
      return NextResponse.json(result, { status: 500 });
    }

    // 6. Generate JWT access and refresh tokens
    const jwtTokens = await generateToken({
      userId: result.userId,
      email: payload.email,
      language: result.language || null,
      providers: result.providers || ["Google"],
      prismaClient,
      accessTokenExpiresIn: "1h",
      refreshTokenExpiryDays: 30,
    });

    // 7. Prepare response body
    const responseBody: TokenResult = {
      token: jwtTokens.accessToken,
      language: result.language ?? undefined,
      providers: result.providers,
    };

    // 8. Return response differently for native vs web
    if (isNative) {
      // Native: include refresh token in JSON
      responseBody.refreshToken = jwtTokens.refreshToken;
      return NextResponse.json(responseBody);
    } else {
      // Web: set refresh token as HTTP-only cookie
      const response = NextResponse.json(responseBody);
      response.cookies.set("refreshToken", jwtTokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
      return response;
    }
  } catch (err) {
    // 9. Catch-all error handler
    console.error(err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


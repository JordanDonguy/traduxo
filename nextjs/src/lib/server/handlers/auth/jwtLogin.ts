import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { authorizeUser } from "@/lib/server/auth/authorizeUser";
import { generateToken } from "@/lib/server/auth/generateToken";

export interface JwtLoginDeps {
  authorizeUserFn?: typeof authorizeUser;
  prismaClient?: typeof prisma;
  cryptoFn?: typeof import("crypto");
  bcryptFn?: typeof import("bcrypt");
  jwtFn?: typeof import("jsonwebtoken");
}

export async function jwtLoginHandler(
  req: NextRequest,
  {
    authorizeUserFn = authorizeUser,
    prismaClient = prisma,
    cryptoFn,
    bcryptFn,
    jwtFn,
  }: Partial<JwtLoginDeps>
) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    }

    // Validate credentials
    const result = await authorizeUserFn({ email, password });

    if (!result.success) {
      const status = result.reason === "MissingCredentials" || result.reason === "InvalidInput" ? 400 : 401;
      return NextResponse.json({ error: result.reason }, { status });
    }

    // If success
    const { user } = result;
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Generate access + refresh tokens
    const tokens = await generateToken({
      userId: user.id,
      email: user.email,
      language: user.language,
      providers: user.providers,
      prismaClient,
      cryptoFn,
      bcryptFn,
      jwtFn,
      accessTokenExpiresIn: "1h",
      refreshTokenExpiryDays: 30,
    });

    return NextResponse.json(tokens);
  } catch (err) {
    console.error("JWT login error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

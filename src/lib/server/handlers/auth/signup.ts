import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { loginSchema } from "@/lib/shared/schemas/auth/login.schemas";
import { ZodError } from "zod";
import sanitizeHtml from "sanitize-html";
import type { PrismaClient } from "@prisma/client/extension";

export async function signupHandler({
  body,
  prismaClient,
}: {
  body: unknown; // raw input, unknown shape until validated by Zod
  prismaClient: Partial<PrismaClient>;
}) {
  try {
    // 1. Validate and parse input using zod
    const { email, password } = loginSchema.parse(body);

    // 2. Sanitize email to prevent XSS
    const cleanEmail = sanitizeHtml(email, { allowedTags: [], allowedAttributes: {} });

    // 3. Check presence of email and password
    if (!cleanEmail || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    // 4. Check if user already exists
    const existingUser = await prismaClient.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User already exists" },
        { status: 409 }
      );
    }

    // 5. Hash the password securely
    const hashedPassword = await bcrypt.hash(password, 10);

    // 6. Create new user in DB
    await prismaClient.user.create({
      data: {
        email: cleanEmail,
        password: hashedPassword,
        providers: ["Credentials"],
      },
    });

    // 7. Return success response
    return NextResponse.json(
      { message: "User created successfully" },
      { status: 201 }
    );
  } catch (error) {
    // 8. Handle Zod validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    // 9. Log other errors and return 500
    console.error("Error registering user:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

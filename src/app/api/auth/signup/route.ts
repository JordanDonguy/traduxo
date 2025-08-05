import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/schemas";
import { ZodError } from "zod";
import sanitizeHtml from "sanitize-html";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate and parse input
    const { email, password } = loginSchema.parse(body);

    // Sanitize email
    const cleanEmail = sanitizeHtml(email, { allowedTags: [], allowedAttributes: {} });

    if (!cleanEmail || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    await prisma.user.create({
      data: {
        email: cleanEmail,
        password: hashedPassword,
        providers: ["Credentials"],
      },
    });

    return NextResponse.json(
      { message: "User created successfully" },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error("Error registering user:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

// src/app/api/update-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { getServerSession } from 'next-auth';
import authOptions from "@/lib/auth/authOptions";
import { createPasswordSchema } from "@/lib/schemas";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Parse body using schema
    const { password } = createPasswordSchema.parse(body);

    if (!password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch user from DB using Prisma
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, password: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.password) {
      return NextResponse.json({ error: 'User already has a password' }, { status: 401 });
    }

    // Hash the new password
    const hashedpassword = await bcrypt.hash(password, 10);

    // Update user with the new password and providers
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedpassword,
        providers: ['Credentials', 'Google'],
      },
    });

    return NextResponse.json({ success: true });

  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: err.issues[0].message },
        { status: 400 }
      );
    }

    console.error('Update password error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

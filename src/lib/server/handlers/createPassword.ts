import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { getServerSession } from 'next-auth';
import authOptions from "@/lib/server/auth/authOptions";
import { createPasswordSchema } from "@/lib/shared/schemas";
import { ZodError } from "zod";
import { prisma } from "@/lib/server/prisma";

export async function createPassword(
  req: Request,
  {
    getSessionFn,
    prismaClient,
  }: {
    getSessionFn: typeof getServerSession;
    prismaClient: typeof prisma;
  }
) {
  try {
    // 1. Authenticate user session
    const session = await getSessionFn(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // 2. Parse body using schema
    const { password } = createPasswordSchema.parse(body);

    if (!password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 3. Fetch user from DB using Prisma
    const user = await prismaClient.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, password: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.password) {
      return NextResponse.json({ error: 'User already has a password' }, { status: 401 });
    }

    // 4. Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Update user with new password and providers
    await prismaClient.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        providers: ['Credentials', 'Google'],
      },
    });

    return NextResponse.json({ success: true });

  } catch (err) {
    // 6. Handle validation or unexpected errors
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

import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/server/auth/authOptions';
import { updatePasswordSchema } from '@/lib/shared/schemas';
import { ZodError } from 'zod';
import type { PrismaClient } from "@prisma/client/extension";

export async function updatePassword(
  req: Request,
  {
    getSessionFn,
    prismaClient,
  }: {
    getSessionFn: typeof getServerSession;
    prismaClient: Partial<PrismaClient>;
  }
) {
  try {
    // 1. Get user session from NextAuth
    const session = await getSessionFn(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // 2. Validate inputs with Zod
    const { currentPassword, password } = updatePasswordSchema.parse(body);

    // 3. Find user in Prisma
    const user = await prismaClient.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, password: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.password) {
      return NextResponse.json({ error: 'No password set for user' }, { status: 400 });
    }

    // 4. Compare current password
    const passwordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 403 });
    }

    // 5. Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 6. Update password in database
    await prismaClient.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
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

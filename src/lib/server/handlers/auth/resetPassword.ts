import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { ZodError } from 'zod';
import { resetPasswordSchema } from '@/lib/shared/schemas';
import { PrismaClient } from "@prisma/client/extension";

export async function resetPassword(
  req: Request,
  { prismaClient }: Partial<PrismaClient>
) {
  try {
    const body = await req.json();

    // 1. Validate input
    const { password, token } = resetPasswordSchema.parse(body);

    // 2. Find token in DB
    const resetRecord = await prismaClient.passwordReset.findUnique({
      where: { token },
      select: { id: true, userId: true, expiresAt: true },
    });

    if (!resetRecord) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    // 3. Check if token is expired
    if (resetRecord.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Token has expired' }, { status: 400 });
    }

    // 4. Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Update user's password
    await prismaClient.user.update({
      where: { id: resetRecord.userId },
      data: { password: hashedPassword },
    });

    // 6. Delete the used token
    await prismaClient.passwordReset.delete({
      where: { id: resetRecord.id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: err.issues[0].message },
        { status: 400 }
      );
    }
    console.error('Reset password error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

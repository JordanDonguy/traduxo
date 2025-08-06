import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { getServerSession } from 'next-auth';
import authOptions from "@/lib/auth/authOptions";
import { updatePasswordSchema } from "@/lib/schemas";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Validate inputs with Zod
    const { currentPassword, password } = updatePasswordSchema.parse(body);

    // Find user in Prisma
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, password: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    };

    if (!user.password) {
      return NextResponse.json({ error: 'No password set for user' }, { status: 400 });
    }

    // Compare current password
    const passwordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 403 });
    }

    // Hash new password
    const hashedpassword = await bcrypt.hash(password, 10);

    // Update password using Prisma
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedpassword },
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

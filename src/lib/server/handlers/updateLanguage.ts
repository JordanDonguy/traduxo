import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import authOptions from '@/lib/server/auth/authOptions';
import { langSchema } from '@/lib/shared/schemas';
import { ZodError } from 'zod';
import type { PrismaClient } from "@prisma/client/extension";

export async function updateLanguage(
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
    // 1. Get user session
    const session = await getSessionFn(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse and validate language code
    const body = await req.json();
    const code = langSchema.parse(body.code);

    // 3. Find user
    const user = await prismaClient.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 4. Update systemLang
    await prismaClient.user.update({
      where: { id: user.id },
      data: { systemLang: code },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: err.issues[0].message },
        { status: 400 }
      );
    }

    console.error('Update language error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

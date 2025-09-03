import { NextResponse } from 'next/server';
import { langSchema } from '@/lib/shared/schemas';
import { ZodError } from 'zod';
import type { PrismaClient } from "@prisma/client/extension";
import { checkAuth } from '../../middlewares/checkAuth';

export async function updateLanguage(
  req: Request,
  {
    prismaClient,
  }: {
    prismaClient: Partial<PrismaClient>;
  }
) {
  try {
    // 1. Authenticate user (web or mobile)
    const auth = await checkAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { email: userEmail } = auth.user;

    // 2. Parse and validate language code
    const body = await req.json();
    const code = langSchema.parse(body.code);

    // 3. Find user
    const user = await prismaClient.user.findUnique({
      where: { email: userEmail },
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

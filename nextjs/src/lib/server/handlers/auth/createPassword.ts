import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { createPasswordSchema } from "@/lib/shared/schemas/password/createPassword.schemas";
import { ZodError } from "zod";
import type { PrismaClient } from "@prisma/client/extension";
import { checkAuth } from "@/lib/server/middlewares/checkAuth";

export async function createPassword(
  req: Request,
  { prismaClient }: { prismaClient: Partial<PrismaClient> }
) {
  try {
    // 1️⃣ Authenticate user (web or mobile)
    const auth = await checkAuth(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id: userId, email: userEmail } = auth.user;

    // 2️⃣ Parse request body
    const body = await req.json();
    const { password } = createPasswordSchema.parse(body);

    // 3️⃣ Fetch user from DB
    const user = await prismaClient.user.findUnique({
      where: { email: userEmail },
      select: { id: true, password: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.password) {
      return NextResponse.json({ error: "User already has a password" }, { status: 401 });
    }

    // 4️⃣ Hash and update password
    const hashedPassword = await bcrypt.hash(password, 10);
    await prismaClient.user.update({
      where: { id: userId },
      data: { password: hashedPassword, providers: ["Credentials", "Google"] },
    });

    return NextResponse.json({ success: true });

  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    console.error("Update password error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

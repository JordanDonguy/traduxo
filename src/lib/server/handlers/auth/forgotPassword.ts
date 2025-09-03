import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client/extension";
import { nanoid } from "nanoid";
import { EmailParams, Sender, Recipient } from "mailersend";
import { mailerSend } from "@/lib/server/mailerSend";

export async function forgotPassword(
  req: Request,
  { prismaClient,
    mailerSendClient
  }: {
    prismaClient: Partial<PrismaClient>;
    mailerSendClient: typeof mailerSend;
  }
) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // 1. Check if user exists
    const user = await prismaClient.user.findUnique({
      where: { email },
    });

    // Always return same response to avoid revealing valid emails
    if (!user) {
      return NextResponse.json({
        message: "If this email exists, a reset link has been sent.",
      });
    }

    // 2. Generate reset token and expiry
    const token = nanoid(32);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prismaClient.passwordReset.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // 3. Send email
    const sender: Sender = {
      name: "Traduxo",
      email: process.env.MAILERSEND_FROM!, // must be verified domain
    };

    const recipient: Recipient = {
      email: user.email,
    };

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
    const logoUrl = `${process.env.NEXT_PUBLIC_APP_URL}/logo.png`;

    const emailParams = new EmailParams()
      .setFrom(sender)
      .setTo([recipient])
      .setSubject("Reset your password")
      .setHtml(`
    <div style="font-family:sans-serif; text-align:center;">
      <img src="${logoUrl}" alt="Traduxo Logo" width="106" height="24" style="margin-bottom:16px;" />
      <h1 style="font-size:20px; margin-bottom:12px;">Reset Your Password</h1>
      <p style="margin-bottom:16px;">Click the button below to reset your password. This link will expire in 1 hour.</p>
      <a href="${resetUrl}" style="
        display:inline-block;
        padding:12px 24px;
        background-color:#4F46E5;
        color:white;
        text-decoration:none;
        border-radius:6px;
        font-weight:bold;
      ">Reset Password</a>
      <p style="font-size:12px; color:#666; margin-top:16px;">
        If you didn't request a password reset, you can safely ignore this email.
      </p>
    </div>
  `);

    await mailerSendClient.email.send(emailParams);

    return NextResponse.json({
      message: "If this email exists, a reset link has been sent.",
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

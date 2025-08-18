import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { checkQuota } from '@/lib/server/dailyLimiter';
import authOptions from "../auth/authOptions";
import { getServerSession } from 'next-auth';

// -------------- Config --------------
export const runtime = 'nodejs';

// Schema to validate input
const BodySchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  model: z.string().optional().default('gemini-2.5-flash-lite-preview-06-17'),
  isSuggestion: z.boolean().optional(),
});

// -------------- Inner handler --------------
export async function geminiComplete(
  req: Request,
  {
    checkQuotaFn,
    genai,
    getSessionFn = getServerSession,
  }: {
    checkQuotaFn: typeof checkQuota;
    genai: InstanceType<typeof GoogleGenAI>;
    getSessionFn?: typeof getServerSession;
  }
) {
  // 1. Parse & validate input
  const parse = BodySchema.safeParse(await req.json());
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  }

  const { prompt, model, isSuggestion } = parse.data;

  // 2. Check auth status
  const session = await getSessionFn(authOptions);
  const isLoggedIn = !!session?.user;

  // 3. Quota only for guest + suggestion mode
  let remaining: number | undefined;
  if (!isLoggedIn && isSuggestion) {
    const quota = await checkQuotaFn(req as NextRequest);
    if (!quota.allowed) {
      return NextResponse.json(
        {
          error:
            "To continue using the suggestion feature, please log in 🙏\nDon't worry, it only takes less than a minute 😉",
        },
        { status: 429 }
      );
    }
    remaining = quota.remaining;
  }

  try {
    // 4. Call Gemini API
    const result = await genai.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature: 0.8,
        topP: 0.8,
        topK: 50,
      },
    });

    // 5. Build response
    const res = NextResponse.json({ text: result.text });

    if (remaining !== undefined) {
      res.headers.set('X-RateLimit-Remaining', remaining.toString());
    }

    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      {
        error: 'Gemini API error',
        details: String((err as Error).message),
      },
      { status: 500 }
    );
  }
}

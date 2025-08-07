import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { checkQuota } from '@/lib/server/dailyLimiter';

// -------------- Config --------------
export const runtime = 'nodejs';  // switch to 'edge' for lower latency

// Schema to validate input and keep handler tidy
const BodySchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  model: z.string().optional().default('gemini-2.5-flash-lite-preview-06-17'),
});

// -------------- Inner handler --------------
export async function geminiComplete(
  req: Request,
  {
    checkQuotaFn,
    genai,
  }: {
    checkQuotaFn: typeof checkQuota;
    genai: InstanceType<typeof GoogleGenAI>;
  }
) {
  // 1. Parse and validate input using Zod schema
  const parse = BodySchema.safeParse(await req.json());
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  }

  const { prompt, model } = parse.data;

  // 2. Check rate limiting quotas and return a 429 error if quota exceeded
  const { allowed, remaining } = await checkQuotaFn(req as NextRequest);
  if (!allowed) {
    return NextResponse.json(
      {
        error:
          "Sorry, you've reached your translation limit for today... 😥\nPlease come again tomorrow 🙏",
      },
      { status: 429 }
    );
  }

  try {
    // 3. Call Gemini API with prompt and model
    const result = await genai.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature: 0.8,
        topP: 0.8,
        topK: 50,
      },
    });

    // 4. Build response and add remaining‑quota header
    const res = NextResponse.json({ text: result.text });
    res.headers.set('X-RateLimit-Remaining', remaining.toString());
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

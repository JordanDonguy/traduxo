import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { checkQuota } from "@/lib/dailyLimiter";

export const runtime = 'nodejs';  // switch to 'edge' for lower latency

// Simple schema to keep the handler tidy
const BodySchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  model: z.string().optional().default('gemini-2.5-flash-lite-preview-06-17'),
});

export async function POST(req: NextRequest) {
  // 1. parse & validate
  const parse = BodySchema.safeParse(await req.json());
  if (!parse.success)
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  const { prompt, model } = parse.data;

  // 2. Check rate limiting quotas and returns a 429 error if quota's exceeded
  const { allowed, remaining } = await checkQuota(req);
  if (!allowed) {
    return NextResponse.json(
      { error: "Sorry, you've reached your translation limit for today... 😥\nPlease come again tomorrow 🙏" },
      { status: 429 },
    )
  };

  try {
    // 3. talk to Gemini
    const ai = new GoogleGenAI({});               // picks up GEMINI_API_KEY
    const result = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    // 4. build the response and add remaining‑quota header */
    const res = NextResponse.json({ text: result.text });
    res.headers.set("X-RateLimit-Remaining", remaining.toString());
    return res;
  } catch (err) {
    console.error(err);
    return Response.json(
      { error: 'Gemini API error', details: String((err as Error).message) },
      { status: 500 },
    );
  }
}

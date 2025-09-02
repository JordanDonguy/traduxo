import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';

// -------------- Config --------------
export const runtime = 'nodejs';

// Schema to validate input
const BodySchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  model: z.string().optional().default('gemini-2.5-flash-lite-preview-06-17'),
});

// -------------- Inner handler --------------
export async function geminiComplete(
  req: Request,
  {
    genai,
  }: {
    genai: InstanceType<typeof GoogleGenAI>;
  }
) {
  // 1. Parse & validate input
  const parse = BodySchema.safeParse(await req.json());
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  }

  const { prompt, model } = parse.data;

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

    return NextResponse.json({ text: result.text });
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

import { NextRequest }       from 'next/server';
import { GoogleGenAI }       from '@google/genai';
import { z }                 from 'zod';

export const runtime = 'nodejs';  // switch to 'edge' for lower latency

// Simple schema to keep the handler tidy
const BodySchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  model:  z.string().optional().default('gemini-2.5-flash-lite-preview-06-17'),
});

export async function POST(req: NextRequest) {
  // 1 parse & validate
  const parse = BodySchema.safeParse(await req.json());
  if (!parse.success)
    return Response.json({ error: parse.error.flatten() }, { status: 400 });

  const { prompt, model } = parse.data;

  try {
    // 2 talk to Gemini
    const ai = new GoogleGenAI({});               // picks up GEMINI_API_KEY
    const result = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    // 3 return plain JSON that any client can consume (next.js website or react native app for example)
    return Response.json({ text: result.text });
  } catch (err: any) {
    console.error(err);
    return Response.json(
      { error: 'Gemini API error', details: String(err.message) },
      { status: 500 },
    );
  }
}

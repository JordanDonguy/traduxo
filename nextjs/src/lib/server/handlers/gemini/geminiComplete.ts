import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';

// -------------- Config --------------
export const runtime = 'edge';

// Schema to validate input
const BodySchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  model: z.string().optional().default('gemini-2.5-flash-lite'),
});

// -------------- Edge handler --------------
export async function geminiComplete(
  req: Request,
  { genai }: { genai: InstanceType<typeof GoogleGenAI> }
) {
  try {
    // 1. Parse & validate request body
    const parse = BodySchema.safeParse(await req.json());
    if (!parse.success) {
      return new Response(JSON.stringify({ error: parse.error.flatten() }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { prompt, model } = parse.data;

    // 2. Call Gemini API
    const result = await genai.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature: 0.8,
        topP: 0.8,
        topK: 50,
      },
    });

    // 3. Return JSON response
    return new Response(JSON.stringify({ text: result.text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({
        error: 'Gemini API error',
        details: String((err as Error).message),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

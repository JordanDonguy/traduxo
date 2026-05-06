import Groq from 'groq-sdk';
import { z } from 'zod';

export const runtime = 'edge';

const BodySchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  model: z.string().optional(),
});

// Pool generation is one-language idiom recall — llama 3.3 is fast and accurate enough.
const DEFAULT_COMPLETE_MODEL = 'llama-3.3-70b-versatile';

export async function aiComplete(
  req: Request,
  { groq }: { groq: Groq }
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

    const { prompt, model: modelOverride } = parse.data;
    const model = modelOverride ?? DEFAULT_COMPLETE_MODEL;
    const isQwen = model.startsWith('qwen/');

    // 2. Call Groq API with forced JSON output.
    // reasoning_format: "hidden" strips Qwen3's <think> blocks server-side; only sent for Qwen.
    const result = await groq.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6,
      top_p: 0.8,
      response_format: { type: 'json_object' },
      ...(isQwen ? ({ reasoning_format: 'hidden' } as Record<string, unknown>) : {}),
    });

    const text = result.choices[0]?.message?.content ?? '';

    // 3. Return JSON response
    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error(err);

    if (err instanceof Groq.APIError) {
      if (err.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit reached, please try again shortly.' }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (err.status === 503) {
        return new Response(
          JSON.stringify({ error: 'AI service overloaded' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({
        error: 'AI API error',
        details: String((err as Error).message),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

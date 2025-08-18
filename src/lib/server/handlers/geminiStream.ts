import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';

// -------------- Config --------------
export const runtime = 'nodejs'; // switch to 'edge' for lower latency

// Simple schema to keep the handler tidy
const BodySchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  model: z.string().optional().default('gemini-2.5-flash-lite-preview-06-17'),
});

// -------------- Inner handler --------------
export async function geminiStream(
  req: Request,
  {
    genai,
  }: {
    genai: InstanceType<typeof GoogleGenAI>;
  }
) {
  // 1. Parse & validate request body using Zod
  const parse = BodySchema.safeParse(await req.json());
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  }
  const { prompt, model } = parse.data;

  // 2. Stream Gemini response
  const stream = await genai.models.generateContentStream({
    model,
    contents: prompt,
  });

  // 3. Create a ReadableStream for chunked output
  const encoder = new TextEncoder();
  const readableStream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (chunk.text) {
            controller.enqueue(encoder.encode(chunk.text));
          }
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });

  // 4. Return a streaming response
  return new Response(readableStream);
}

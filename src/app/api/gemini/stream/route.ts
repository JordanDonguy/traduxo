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

  const ai = new GoogleGenAI({});
  const stream = await ai.models.generateContentStream({
    model,
    contents: prompt,
  });

  // 4. Create a ReadableStream for chunked output
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
    }
  });

  // 5. Return a streaming response with quota header
  return new Response(readableStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-RateLimit-Remaining": remaining.toString(),
    },
  });
}

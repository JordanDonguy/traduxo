import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { checkQuota } from "../dailyLimiter";
import authOptions from "../auth/authOptions";
import { getServerSession } from "next-auth";
import { z } from "zod";

// -------------- Config --------------
export const runtime = "nodejs";

// Schema with mode
const BodySchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  model: z.string().optional().default("gemini-2.5-flash-lite-preview-06-17"),
  mode: z.enum(["translation", "explanation", "suggestion"]).default("translation"),
});

// -------------- Inner handler --------------
export async function geminiStream(
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

  // 1. Parse & validate request body
  const parse = BodySchema.safeParse(await req.json());
  if (!parse.success) {
    return NextResponse.json({ error: parse.error.flatten() }, { status: 400 });
  }
  const { prompt, model, mode } = parse.data;

  // 2. Check auth status
  const session = await getSessionFn(authOptions);
  const isLoggedIn = !!session?.user;
  // 3. Quota only for guest + suggestion mode
  let remaining: number | undefined;
  if (!isLoggedIn && mode === "suggestion") {
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

  // 2. Stream Gemini response
  const stream = await genai.models.generateContentStream({
    model,
    contents: prompt,
  });

  const encoder = new TextEncoder();

  // 3. Create a ReadableStream for chunked output
  const readableStream = new ReadableStream({
    async start(controller) {
      let buffer = "";

      try {
        for await (const chunk of stream) {
          if (!chunk.text) continue;

          if (mode === "translation" || mode === "suggestion") {
            // Accumulate raw text into buffer
            buffer += chunk.text;

            // Try to extract valid JSON objects from the buffer
            let startIdx = buffer.indexOf("{");
            while (startIdx !== -1) {
              const endIdx = buffer.indexOf("}", startIdx);
              if (endIdx === -1) break; // no complete object yet

              const candidate = buffer.slice(startIdx, endIdx + 1);
              try {
                JSON.parse(candidate); // validate JSON
                controller.enqueue(encoder.encode(candidate + "\n"));
                buffer = buffer.slice(endIdx + 1);
              } catch {
                // Not valid JSON yet, wait for more chunks
                break;
              }

              startIdx = buffer.indexOf("{");
            }
          } else {
            // 👉 In explanation mode, stream plain markdown as-is
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
  const res = new Response(readableStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
  if (remaining !== undefined) {
    res.headers.set('X-RateLimit-Remaining', remaining.toString());
  }
  return res;
}

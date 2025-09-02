import { GoogleGenAI } from "@google/genai";
import { checkQuota } from "../dailyLimiter";
import authOptions from "../auth/authOptions";
import { getServerSession } from "next-auth";
import { z } from "zod";

// Edge runtime
export const runtime = "edge";

// ---------------- Schema ----------------
const BodySchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  model: z.string().optional().default("gemini-2.5-flash-lite-preview-06-17"),
  mode: z.enum(["translation", "explanation", "suggestion"]).default("translation"),
});

// ---------------- Handler ----------------
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
  try {
    // 1. Parse & validate JSON
    const body = await req.json();
    const parse = BodySchema.safeParse(body);

    if (!parse.success) {
      return new Response(JSON.stringify({ error: parse.error.flatten() }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { prompt, model, mode } = parse.data;

    // 2. Check auth session
    const session = await getSessionFn(authOptions);
    const isLoggedIn = !!session?.user;

    // 3. Quota only for guests in suggestion mode
    let remaining: number | undefined;
    if (!isLoggedIn && mode === "suggestion") {
      const quota = await checkQuotaFn(req);
      if (!quota.allowed) {
        return new Response(
          JSON.stringify({
            error:
              "To continue using the suggestion feature, please log in 🙏\nDon't worry, it only takes less than a minute 😉",
          }),
          { status: 429, headers: { "Content-Type": "application/json" } }
        );
      }
      remaining = quota.remaining;
    }

    // 4. Stream AI response
    const stream = await genai.models.generateContentStream({
      model,
      contents: prompt,
    });

    const encoder = new TextEncoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        let buffer = "";

        try {
          for await (const chunk of stream) {
            if (!chunk.text) continue;

            if (mode === "translation" || mode === "suggestion") {
              buffer += chunk.text;

              let startIdx = buffer.indexOf("{");
              while (startIdx !== -1) {
                const endIdx = buffer.indexOf("}", startIdx);
                if (endIdx === -1) break;

                const candidate = buffer.slice(startIdx, endIdx + 1);
                try {
                  JSON.parse(candidate);
                  controller.enqueue(encoder.encode(candidate + "\n"));
                  buffer = buffer.slice(endIdx + 1);
                } catch {
                  break;
                }

                startIdx = buffer.indexOf("{");
              }
            } else {
              // Explanation mode: stream as plain text
              controller.enqueue(encoder.encode(chunk.text));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    // 5. Return response with optional rate limit header
    const res = new Response(readableStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        ...(remaining !== undefined && { "X-RateLimit-Remaining": remaining.toString() }),
      } as Record<string, string>,
    });

    return res;
  } catch (err: unknown) {
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

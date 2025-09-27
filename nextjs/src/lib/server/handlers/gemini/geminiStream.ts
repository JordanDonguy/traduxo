import { GoogleGenAI } from "@google/genai";
import { checkQuota } from "../../dailyLimiter";
import { checkAuth } from "../../middlewares/checkAuth";
import { z } from "zod";

// Edge runtime
export const runtime = "edge";

// ---------------- Schema ----------------
const BodySchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  model: z.string().optional().default("gemini-2.5-flash-lite-preview-09-2025"),
  mode: z.enum(["translation", "explanation", "suggestion"]).default("translation"),
});

// ---------------- Handler ----------------
export async function geminiStream(
  req: Request,
  {
    checkQuotaFn,
    genai,
  }: {
    checkQuotaFn: typeof checkQuota;
    genai: InstanceType<typeof GoogleGenAI>;
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
    const isLoggedIn = await checkAuth(req);

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

    const message = String((err as Error).message);

    // Detect Gemini overload
    if (message.includes('"code": 503') || message.includes("503")) {
      return new Response(
        JSON.stringify({ error: "Gemini overloaded" }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Default server error
    return new Response(
      JSON.stringify({
        error: "Gemini API error",
        details: message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

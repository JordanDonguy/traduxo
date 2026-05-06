import Groq from "groq-sdk";
import { z } from "zod";
import type { checkQuota } from "../../dailyLimiter";
import { checkAuth } from "../../middlewares/checkAuth";

export const runtime = "edge";

// ---------------- Schema ----------------
const BodySchema = z.object({
  prompt: z.string().min(1, "Prompt is required"),
  model: z.string().optional(),
  mode: z.enum(["translation", "explanation", "suggestion"]).default("translation"),
  audio: z.string().optional()
});

// Pick the right Groq model per mode unless the caller overrides it.
// Qwen3 understands idioms better but is slower → use it for explanation.
// Llama 3.3 is faster and accurate enough for short-form translation/suggestion.
function modelForMode(mode: "translation" | "explanation" | "suggestion"): string {
  return mode === "explanation" ? "qwen/qwen3-32b" : "llama-3.3-70b-versatile";
}

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

// ---------------- Handler ----------------
export async function aiStream(
  req: Request,
  {
    checkQuotaFn,
    groq,
  }: {
    checkQuotaFn: typeof checkQuota;
    groq: Groq;
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

    const { prompt, model: modelOverride, mode, audio } = parse.data;
    const model = modelOverride ?? modelForMode(mode);
    const isQwen = model.startsWith("qwen/");

    // 2. If audio provided, transcribe with Whisper first
    let userContent = prompt;
    if (audio) {
      const binary = atob(audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const file = new File([bytes], "input.m4a", { type: "audio/m4a" });

      const transcription = await groq.audio.transcriptions.create({
        file,
        model: "whisper-large-v3-turbo",
        response_format: "verbose_json",
      });

      const detectedLang =
        (transcription as { language?: string }).language ?? "unknown";
      userContent = `${prompt}\n\nTranscribed audio: "${transcription.text}"\nDetected source language: ${detectedLang}`;
    }

    const messages: ChatMessage[] = [{ role: "user", content: userContent }];

    // 3. Check auth session
    const isLoggedIn = await checkAuth(req);

    // 4. Quota only for guests in suggestion mode
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

    // 5. Stream AI response.
    // reasoning_format: "hidden" strips Qwen3's <think> blocks server-side; only sent for Qwen.
    const stream = await groq.chat.completions.create({
      model,
      messages,
      stream: true,
      temperature: 0.6,
      ...(isQwen ? ({ reasoning_format: "hidden" } as Record<string, unknown>) : {}),
    });

    const encoder = new TextEncoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        let buffer = "";

        try {
          for await (const chunk of stream) {
            const delta = chunk.choices?.[0]?.delta?.content;
            if (!delta) continue;

            if (mode === "translation" || mode === "suggestion") {
              buffer += delta;

              let startIdx = buffer.indexOf("{");
              while (startIdx !== -1) {
                const endIdx = buffer.indexOf("}", startIdx);
                if (endIdx === -1) break;

                const candidate = buffer.slice(startIdx, endIdx + 1);
                try {
                  JSON.parse(candidate);
                  controller.enqueue(encoder.encode(`${candidate}\n`));
                  buffer = buffer.slice(endIdx + 1);
                } catch {
                  break;
                }

                startIdx = buffer.indexOf("{");
              }
            } else {
              // Explanation mode: stream as plain text
              controller.enqueue(encoder.encode(delta));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    // 6. Return response with optional rate limit header
    const res = new Response(readableStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        ...(remaining !== undefined && { "X-RateLimit-Remaining": remaining.toString() }),
      } as Record<string, string>,
    });

    return res;
  } catch (err: unknown) {
    console.error(err);

    if (err instanceof Groq.APIError) {
      if (err.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit reached, please try again shortly." }),
          { status: 429, headers: { "Content-Type": "application/json" } }
        );
      }
      if (err.status === 503) {
        return new Response(
          JSON.stringify({ error: "AI service overloaded" }),
          { status: 503, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({
        error: "AI API error",
        details: String((err as Error).message),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

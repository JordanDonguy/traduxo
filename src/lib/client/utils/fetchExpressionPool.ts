import { getPoolPrompt } from "@/lib/shared/geminiPrompts";
import { cleanGeminiResponse } from "./cleanGeminiResponse";

type PoolHelperArgs = {
  detectedLang: string;
  setExpressionPool: React.Dispatch<React.SetStateAction<string[]>>;
  setError: React.Dispatch<React.SetStateAction<string>>;
};

// Get a pool of raw expressions (no translations)
export async function fetchExpressionPoolHelper({
  setError,
  detectedLang,
  setExpressionPool,
}: PoolHelperArgs) {
  const poolPrompt = getPoolPrompt(detectedLang);

  const res = await fetch("/api/gemini/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: poolPrompt }),
  });

  if (res.status === 429) {
    const { error } = await res.json();
    setError(error);
    return;
  }

  if (!res.ok) throw new Error(`Gemini pool request error: ${res.status}`);

  const { text } = await res.json();
  const poolArray: string[] = JSON.parse(cleanGeminiResponse(text));

  setExpressionPool(
    poolArray.map(expr => expr.replace(/\.+$/, "")) // remove trailing dots
  );
}

// fetchExpressionPoolHelper.ts
import { getPoolPrompt } from "@/lib/shared/geminiPrompts";
import { cleanGeminiResponse } from "../ui/cleanGeminiResponse";
import { SuggestionResult } from "../../../../../../packages/types/suggestionResult";

type PoolHelperArgs = {
  token: string | undefined;
  suggestionLang: string;
  setExpressionPool: React.Dispatch<React.SetStateAction<string[]>>;
  setError: React.Dispatch<React.SetStateAction<string>>;
  // Injected Dependencies for testing
  fetcher?: typeof fetch;
  promptGetter?: (lang: string) => string;
  responseCleaner?: (raw: string) => string;
};

export async function fetchExpressionPoolHelper({
  token,
  suggestionLang,
  setExpressionPool,
  setError,
  fetcher = fetch,
  promptGetter = getPoolPrompt,
  responseCleaner = cleanGeminiResponse,
}: PoolHelperArgs): Promise<SuggestionResult<string[]>> {
  try {
    const poolPrompt = promptGetter(suggestionLang);

    const res = await fetcher("/api/gemini/complete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}), // only add if token exists
      },
      body: JSON.stringify({ prompt: poolPrompt }),
    });

    if (res.status === 429) {
      const { error } = await res.json();
      setError(error);
      return { success: false, error };
    };

    if (!res.ok) throw new Error(`Gemini pool request error: ${res.status}`);

    const { text } = await res.json();
    const poolArray: string[] = JSON.parse(responseCleaner(text));

    const cleanedPool = poolArray.map((expr) => expr.replace(/\.+$/, ""));
    setExpressionPool(cleanedPool);

    return { success: true, data: cleanedPool };
  } catch (err: unknown) {
    console.error(err);
    const errorMsg = "Oops! Something went wrong on our server.\nPlease try again in a few moments 🙏";
    setError(errorMsg);
    return { success: false, error: errorMsg };
  }
}

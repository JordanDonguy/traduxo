
import { getPoolPrompt } from "../geminiPrompts";
import { cleanGeminiResponse } from "../formatting/cleanGeminiResponse";
import { SetState } from "@traduxo/packages/types/reactSetState";
import { SuggestionResult } from "@traduxo/packages/types/suggestionResult";
import { API_BASE_URL } from "../config/apiBase";

type PoolHelperArgs = {
  suggestionLang: string;
  setExpressionPool: SetState<string[]>;
  setError: SetState<string>;
  // Injected Dependencies (testability / overrides)
  fetcher?: typeof fetch;
  promptGetter?: (lang: string) => string;
  responseCleaner?: (raw: string) => string;
};

export async function fetchExpressionPoolHelper({
  suggestionLang,
  setExpressionPool,
  setError,
  fetcher = fetch,
  promptGetter = getPoolPrompt,
  responseCleaner = cleanGeminiResponse,
}: PoolHelperArgs): Promise<SuggestionResult<string[]>> {
  try {
    const poolPrompt = promptGetter(suggestionLang);

    const res = await fetcher(`${API_BASE_URL}/gemini/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: poolPrompt }),
    });

    if (res.status === 429) {
      const { error } = await res.json();
      setError(error);
      return { success: false, error };
    }

    if (!res.ok) throw new Error(`Gemini pool request error: ${res.status}`);

    const { text } = await res.json();
    const poolArray: string[] = JSON.parse(responseCleaner(text));

    const cleanedPool = poolArray.map((expr) => expr.replace(/\.+$/, ""));
    setExpressionPool(cleanedPool);

    return { success: true, data: cleanedPool };
  } catch (err: unknown) {
    console.error(err);
    const errorMsg =
      "Oops! Something went wrong on our server.\nPlease try again in a few moments 🙏";
    setError(errorMsg);
    return { success: false, error: errorMsg };
  }
}

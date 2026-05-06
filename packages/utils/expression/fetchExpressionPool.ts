
import type { SetState } from "@traduxo/packages/types/reactSetState";
import type { SuggestionResult } from "@traduxo/packages/types/suggestionResult";
import { getPoolPrompt } from "../aiPrompts";
import { API_BASE_URL } from "../config/apiBase";
import { cleanAIResponse } from "../formatting/cleanAIResponse";

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
  responseCleaner = cleanAIResponse,
}: PoolHelperArgs): Promise<SuggestionResult<string[]>> {
  try {
    const poolPrompt = promptGetter(suggestionLang);

    const res = await fetcher(`${API_BASE_URL}/ai/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: poolPrompt }),
    });

    if (res.status === 429) {
      const { error } = await res.json();
      setError(error);
      return { success: false, error };
    }

    if (!res.ok) throw new Error(`AI pool request error: ${res.status}`);

    const { text } = await res.json();
    const parsed: unknown = JSON.parse(responseCleaner(text));
    // json_object mode returns a wrapped object; accept either { expressions: [...] } or a raw array.
    const poolArray: string[] = Array.isArray(parsed)
      ? (parsed as string[])
      : ((parsed as { expressions?: string[] })?.expressions ?? []);

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

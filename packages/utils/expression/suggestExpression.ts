import { getSuggestionPrompt } from "../geminiPrompts";
import { TranslationItem } from "@traduxo/packages/types/translation";
import { blurActiveInput } from "../ui/blurActiveInput";
import { decodeStream } from "../formatting/decodeStream";
import { SetState } from "@traduxo/packages/types/reactSetState";
import { API_BASE_URL } from "../config/apiBase";

type SuggestionHelperArgs = {
  detectedLang: string;
  outputLang: string;
  setTranslatedText: SetState<TranslationItem[]>;
  setInputTextLang: SetState<string>;
  setSaveToHistory: SetState<boolean>;
  setTranslatedTextLang: SetState<string>;
  setExplanation: SetState<string>;
  setIsLoading: SetState<boolean>;
  setIsFavorite: SetState<boolean>;
  setTranslationId: SetState<string | undefined>;
  setError: SetState<string>;
  fetcher?: typeof fetch;
  promptGetter?: typeof getSuggestionPrompt;
  keyboardModule?: { dismiss: () => void };
};

// Get one normal suggestion with translation
export async function suggestExpressionHelper({
  detectedLang,
  outputLang,
  setTranslatedText,
  setInputTextLang,
  setSaveToHistory,
  setTranslatedTextLang,
  setExplanation,
  setIsLoading,
  setIsFavorite,
  setTranslationId,
  setError,
  fetcher = fetch,
  promptGetter = getSuggestionPrompt,
  keyboardModule,
}: SuggestionHelperArgs) {
  // Blur active input
  blurActiveInput(keyboardModule);

  // Reset state
  setIsLoading(true);
  setError("");
  setTranslatedText([]);
  setExplanation("");
  setIsFavorite(false);
  setTranslationId(undefined);
  setInputTextLang(detectedLang);
  setTranslatedTextLang(outputLang);

  const prompt = promptGetter({ detectedLang, outputLang });

  try {
    const res = await fetcher(`${API_BASE_URL}/api/gemini/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, mode: "suggestion" }),
    });

    if (res.status === 429) {
      const { error } = await res.json();
      setError(error);
      setIsLoading(false);
      return { success: false, error };
    }

    if (!res.ok || !res.body) throw new Error(`Gemini error: ${res.status}`);

    // --- Streaming decode using decodeStream ---
    for await (const line of decodeStream(res.body.getReader())) {
      setIsLoading(false);
      setTranslatedTextLang(outputLang);

      const item: TranslationItem = JSON.parse(line);

      // Clean string: remove trailing dots and trim whitespace
      if (typeof item.value === "string") {
        item.value = item.value.replace(/\.+$/, "").trim();
      }

      setTranslatedText(prev => [...prev, item]);
    }

    setSaveToHistory(true);
    return { success: true };
  } catch (err) {
    console.error(err);
    const errorMsg = "Oops! Something went wrong on our server.\nPlease try again in a few moments 🙏";
    setError(errorMsg);
    setIsLoading(false);
    return { success: false, error: errorMsg };
  }
}

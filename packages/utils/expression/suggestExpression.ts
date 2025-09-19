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
  token?: string | undefined;
  reader?: { read: () => Promise<{ done: boolean; value?: Uint8Array }> };
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
  token,
  reader, // Reader has to be provided if in React Native
}: SuggestionHelperArgs) {
  // ---- Step 0: Blur any active input ----
  blurActiveInput(keyboardModule);

  // ---- Step 1: Reset UI state ----
  setIsLoading(true);
  setError("");
  setTranslatedText([]);
  setExplanation("");
  setIsFavorite(false);
  setTranslationId(undefined);
  setInputTextLang(detectedLang);
  setTranslatedTextLang(outputLang);

  // ---- Step 2: Generate prompt ----
  const prompt = promptGetter({ detectedLang, outputLang });

  try {
    // ---- Step 3: Determine data source (injected reader vs fetch) ----
    let usedReader = reader;

    if (!usedReader) {
      // ---- Step 3a: Fetch from API ----
      const res = await fetcher(`${API_BASE_URL}/gemini/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}), // only include if token provided
        },
        body: JSON.stringify({ prompt, mode: "suggestion" }),
      });

      // ---- Step 3b: Handle rate-limit errors ----
      if (res.status === 429) {
        const { error } = await res.json();
        setError(error);
        setIsLoading(false);
        return { success: false, error };
      }

      // ---- Step 3c: Handle non-ok responses ----
      if (!res.ok || !res.body) throw new Error(`Gemini error: ${res.status}`);

      // ---- Step 3d: Get streaming reader (browser/Next.js) ----
      usedReader = res.body.getReader();
    }

    // ---- Step 4: Stream decode response ----
    for await (const line of decodeStream(usedReader)) {
      // ---- Step 4a: Update UI while streaming ----
      setIsLoading(false);
      setTranslatedTextLang(outputLang);

      // ---- Step 4b: Parse JSON item ----
      const item: TranslationItem = JSON.parse(line);

      // ---- Step 4c: Remove dots at the end of phrases ----
      if (typeof item.value === "string") {
        item.value = item.value.replace(/\.+$/, "").trim();
      }

      // ---- Step 4d: Update translated text state ----
      setTranslatedText(prev => [...prev, item]);
    }

    // ---- Step 5: Save to history ----
    setSaveToHistory(true);
    return { success: true };
  } catch (err) {
    // ---- Step 6: Handle errors ----
    console.error(err);
    const errorMsg =
      "Oops! Something went wrong on our server.\nPlease try again in a few moments 🙏";
    setError(errorMsg);
    setIsLoading(false);
    return { success: false, error: errorMsg };
  }
}

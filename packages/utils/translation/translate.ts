import { getTranslationPrompt } from "../geminiPrompts";
import { TranslationItem } from "@traduxo/packages/types/translation";
import { blurActiveInput } from "@traduxo/packages/utils/ui/blurActiveInput";
import { SetState } from "@traduxo/packages/types/reactSetState";
import { decodeStream } from "@traduxo/packages/utils/formatting/decodeStream";
import { createReader } from "../config/createReader";
import { API_BASE_URL } from "../config/apiBase";

type TranslateHelperArgs = {
  inputText: string;
  inputLang: string;
  outputLang: string;
  setInputText: SetState<string>;
  setInputTextLang: SetState<string>;
  setTranslatedTextLang: SetState<string>;
  setTranslatedText: SetState<TranslationItem[]>;
  setSaveToHistory: SetState<boolean>;
  setExplanation: SetState<string>;
  setIsLoading: SetState<boolean>;
  setIsFavorite: SetState<boolean>;
  setTranslationId: SetState<string | undefined>;
  setError: SetState<string>;
  fetcher?: typeof fetch;
  promptGetter?: typeof getTranslationPrompt;
  keyboardModule?: { dismiss: () => void };
};

export async function translationHelper({
  inputText,
  inputLang,
  outputLang,
  setInputText,
  setInputTextLang,
  setTranslatedTextLang,
  setTranslatedText,
  setSaveToHistory,
  setExplanation,
  setIsLoading,
  setIsFavorite,
  setTranslationId,
  setError,
  fetcher = fetch,
  promptGetter = getTranslationPrompt,
  keyboardModule,
}: TranslateHelperArgs) {
  // ---- Step 0: Guard clause ----
  if (!inputText.length) return { success: false, error: "No input text" };

  // ---- Step 1: Blur any active input ----
  blurActiveInput(keyboardModule);

  // ---- Step 2: Reset UI state ----
  setIsLoading(true);
  setError("");
  setTranslatedText([]);
  setExplanation("");
  setIsFavorite(false);
  setTranslationId(undefined);

  // ---- Step 3: Generate prompt ----
  const prompt = promptGetter({ inputText, inputLang, outputLang });

  // ---- Step 4: Clear input text and update language if not auto ----
  setInputText("");
  if (inputLang !== "auto") setInputTextLang(inputLang);

  try {
    // ---- Step 5: Determine data source (injected reader vs fetch) ----
    let usedReader: { read: () => Promise<{ done: boolean; value?: Uint8Array }> };

    // ---- Step 5a: Fetch from API ----
    const res = await fetcher(`${API_BASE_URL}/gemini/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, mode: "translation" }),
    });

    // ---- Step 5b: Handle rate-limit errors ----
    if (res.status === 429) {
      const { error } = await res.json();
      setError(error);
      setIsLoading(false);
      return { success: false, error };
    }

    // ---- Step 5c: Handle non-ok responses ----
    if (!res.ok) throw new Error(`Gemini error: ${res.status}`);

    // ---- Step 5d: Get streaming reader ----
    if (res.body) {
      usedReader = res.body.getReader(); // real streaming (browser)
    } else {
      usedReader = await createReader(res); // React Native fake reader fallback
    }

    // ---- Step 6: Stream decode response ----
    let detectedInputLang: string | null = null;
    for await (const part of decodeStream(usedReader)) {
      const item: TranslationItem = JSON.parse(part);

      // ---- Step 6a: Remove dots at the end of phrases ----
      if (typeof item.value === "string") {
        item.value = item.value.replace(/\.+$/, "").trim();
      }

      // ---- Step 6b: Detect input language if auto ----
      if (inputLang === "auto" && item.type === "orig_lang_code") {
        detectedInputLang = item.value;
        setInputTextLang(item.value);
      }

      // ---- Step 6c: Update translated text and UI ----
      setTranslatedText(prev => [...prev, item]);
      setIsLoading(false);
      setTranslatedTextLang(outputLang);
    }

    // ---- Step 7: Finalize input language if auto-detected ----
    if (inputLang === "auto") {
      setInputTextLang(prev => prev || detectedInputLang || "XX");
    }

    // ---- Step 8: Save to history ----
    setSaveToHistory(true);
    return { success: true };
  } catch (err: unknown) {
    // ---- Step 9: Handle errors ----
    console.error(err);
    const errorMsg =
      "Oops! Something went wrong on our server.\nPlease try again in a few moments 🙏";
    setError(errorMsg);
    setIsLoading(false);
    return { success: false, error: errorMsg };
  }
}

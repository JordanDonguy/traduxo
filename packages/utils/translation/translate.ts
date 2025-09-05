import { getTranslationPrompt } from "../geminiPrompts";
import { TranslationItem } from "@traduxo/packages/types/translation";
import { blurActiveInput } from "@packages/utils/ui/blurActiveInput";
import { SetState } from "@packages/types/reactSetState";

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
  keyboardModule?: { dismiss: () => void }; // RN keyboard module
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
  if (!inputText.length) return { success: false, message: "No input text" };

  // Blur input / dismiss keyboard
  blurActiveInput(keyboardModule);

  // Reset UI state
  setIsLoading(true);
  setError("");
  setTranslatedText([]);
  setExplanation("");
  setIsFavorite(false);
  setTranslationId(undefined);

  const prompt = promptGetter({ inputText, inputLang, outputLang });
  setInputText(""); // Clear input after sending to AI

  if (inputLang !== "auto") setInputTextLang(inputLang);

  try {
    const res = await fetcher("/api/gemini/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, mode: "translation" }),
    });

    if (res.status === 429) {
      const { error } = await res.json();
      setError(error);
      setIsLoading(false);
      return { success: false, error };
    }

    if (!res.ok || !res.body) throw new Error(`Gemini error: ${res.status}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let detectedInputLang: string | null = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n");
      buffer = parts.pop() || "";

      setIsLoading(false);
      setTranslatedTextLang(outputLang);

      for (const part of parts) {
        if (!part.trim()) continue;
        const item: TranslationItem = JSON.parse(part);

        if (typeof item.value === "string") {
          item.value = item.value.replace(/\.+$/, "");
        }

        if (inputLang === "auto" && item.type === "orig_lang_code") {
          detectedInputLang = item.value;
          setInputTextLang(item.value);
        }

        setTranslatedText(prev => [...prev, item]);
      }
    }

    if (inputLang === "auto") {
      setInputTextLang(prev => prev || detectedInputLang || "XX");
    }

    setSaveToHistory(true);
    return { success: true };
  } catch (err: unknown) {
    console.error(err);
    const errorMsg =
      "Oops! Something went wrong on our server.\nPlease try again in a few moments 🙏";
    setError(errorMsg);
    setIsLoading(false);
    return { success: false, error: errorMsg };
  }
}

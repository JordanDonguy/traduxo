import { getTranslationPrompt } from "@/lib/shared/geminiPrompts";
import { TranslationItem } from "../../../../types/translation";

type TranslateHelperArgs = {
  inputText: string;
  inputLang: string;
  outputLang: string;
  setInputText: React.Dispatch<React.SetStateAction<string>>;
  setInputTextLang: React.Dispatch<React.SetStateAction<string>>;
  setTranslatedTextLang: React.Dispatch<React.SetStateAction<string>>;
  setTranslatedText: React.Dispatch<React.SetStateAction<TranslationItem[]>>;
  setSaveToHistory: React.Dispatch<React.SetStateAction<boolean>>;
  setExplanation: React.Dispatch<React.SetStateAction<string>>; // stays, but unused here
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setIsFavorite: React.Dispatch<React.SetStateAction<boolean>>;
  setTranslationId: React.Dispatch<React.SetStateAction<string | undefined>>;
  setError: React.Dispatch<React.SetStateAction<string>>;
  fetcher?: typeof fetch;
  promptGetter?: typeof getTranslationPrompt;
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
}: TranslateHelperArgs) {
  if (!inputText.length) return { success: false, message: "No input text" };

  // Blur active element safely
  if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }

  // Reset state
  setIsLoading(true);
  setError("");
  setTranslatedText([]);
  setExplanation("");
  setIsFavorite(false);
  setTranslationId(undefined);

  const prompt = promptGetter({ inputText, inputLang, outputLang });
  setInputText("");

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

    // --- Streaming decode (NDJSON) ---
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n");
      buffer = parts.pop() || ""; // keep incomplete chunk

      setIsLoading(false);
      setTranslatedTextLang(outputLang);

      for (const part of parts) {
        if (!part.trim()) continue;
        const item: TranslationItem = JSON.parse(part);
        // Remove trailing dots
        if (typeof item.value === "string") {
          item.value = item.value.replace(/\.+$/, "");
        }
        if (inputLang === "auto" && item.type === "orig_lang_code") {
          setInputTextLang(item.value);
        }
        setTranslatedText(prev => [...prev, item]);
      }
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

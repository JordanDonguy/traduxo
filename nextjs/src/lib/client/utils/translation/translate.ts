import { getTranslationPrompt } from "@/lib/shared/geminiPrompts";
import { TranslationItem } from "../../../../../types/translation";

type TranslateHelperArgs = {
  inputText: string;
  inputLang: string;
  outputLang: string;
  setInputText: React.Dispatch<React.SetStateAction<string>>;
  setInputTextLang: React.Dispatch<React.SetStateAction<string>>;
  setTranslatedTextLang: React.Dispatch<React.SetStateAction<string>>;
  setTranslatedText: React.Dispatch<React.SetStateAction<TranslationItem[]>>;
  setSaveToHistory: React.Dispatch<React.SetStateAction<boolean>>;
  setExplanation: React.Dispatch<React.SetStateAction<string>>;
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

  // Blur active element (input) to hide keyboard or unfocus before processing
  if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }

  // Reset all relevant UI state before starting translation
  setIsLoading(true);
  setError("");
  setTranslatedText([]);
  setExplanation("");
  setIsFavorite(false);
  setTranslationId(undefined);

  // Build the AI translation prompt
  const prompt = promptGetter({ inputText, inputLang, outputLang });
  setInputText(""); // Clear input after sending to AI


  // If user already chose a specific input language, set it immediately
  if (inputLang !== "auto") setInputTextLang(inputLang);

  try {
    // Call Gemini translation streaming API
    const res = await fetcher("/api/gemini/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, mode: "translation" }),
    });

    // Handle rate-limiting errors
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

    // Will store detected language from AI if inputLang is "auto"
    let detectedInputLang: string | null = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n");
      buffer = parts.pop() || ""; // keep incomplete chunk for next iteration

      setIsLoading(false); // start displaying results as soon as chunks arrive
      setTranslatedTextLang(outputLang);    // Set output language

      for (const part of parts) {
        if (!part.trim()) continue;
        const item: TranslationItem = JSON.parse(part);

        // Clean up trailing dots from text
        if (typeof item.value === "string") {
          item.value = item.value.replace(/\.+$/, "");
        }

        // If inputLang is auto, capture the original language code from AI
        if (inputLang === "auto" && item.type === "orig_lang_code") {
          detectedInputLang = item.value;
          setInputTextLang(item.value);
        }

        // Append translated chunk to state for UI rendering
        setTranslatedText(prev => [...prev, item]);
      }
    }

    // Fallback: if no orig_lang_code was detected, default to "XX"
    if (inputLang === "auto") {
      setInputTextLang(prev => prev || detectedInputLang || "XX");
    }

    // Enable saving this translation to history
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

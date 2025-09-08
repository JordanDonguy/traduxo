import { getSuggestionPrompt } from "@/lib/shared/geminiPrompts";
import { cleanGeminiResponse } from "../ui/cleanGeminiResponse";
import { TranslationItem } from "@traduxo/packages/types/translation";

type SuggestionHelperArgs = {
  detectedLang: string;
  outputLang: string;
  setTranslatedText: React.Dispatch<React.SetStateAction<TranslationItem[]>>;
  setInputTextLang: React.Dispatch<React.SetStateAction<string>>;
  setSaveToHistory: React.Dispatch<React.SetStateAction<boolean>>;
  setTranslatedTextLang: React.Dispatch<React.SetStateAction<string>>;
  setExplanation: React.Dispatch<React.SetStateAction<string>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setIsFavorite: React.Dispatch<React.SetStateAction<boolean>>;
  setTranslationId: React.Dispatch<React.SetStateAction<string | undefined>>;
  setError: React.Dispatch<React.SetStateAction<string>>;
  fetcher?: typeof fetch;
  promptGetter?: typeof getSuggestionPrompt;
  responseCleaner?: typeof cleanGeminiResponse;
  token: string | undefined;
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
  token,
}: SuggestionHelperArgs) {
  // Blur active element if in browser
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
  setInputTextLang(detectedLang);
  setTranslatedTextLang(outputLang);

  const prompt = promptGetter({ detectedLang, outputLang });

  try {
    const res = await fetcher("/api/gemini/stream", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}), // only add if token exists
      },
      body: JSON.stringify({ prompt, mode: "suggestion" }),
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
          item.value = item.value.replace(/\.+$/, "").trim();
        }
        setTranslatedText(prev => [...prev, item]);
      }
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

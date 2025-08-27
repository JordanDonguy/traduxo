import { getSuggestionPrompt } from "@/lib/shared/geminiPrompts";
import { cleanGeminiResponse } from "./cleanGeminiResponse";
import { SuggestionResult } from "../../../../types/suggestionResult";

type SuggestionHelperArgs = {
  detectedLang: string;
  outputLang: string;
  setTranslatedText: React.Dispatch<React.SetStateAction<string[]>>;
  setInputTextLang: React.Dispatch<React.SetStateAction<string>>;
  setTranslatedTextLang: React.Dispatch<React.SetStateAction<string>>;
  setExplanation: React.Dispatch<React.SetStateAction<string>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setIsFavorite: React.Dispatch<React.SetStateAction<boolean>>;
  setTranslationId: React.Dispatch<React.SetStateAction<string | undefined>>;
  setError: React.Dispatch<React.SetStateAction<string>>;
  // Injected dependencies for testing
  fetcher?: typeof fetch;
  promptGetter?: typeof getSuggestionPrompt;
  responseCleaner?: typeof cleanGeminiResponse;
};

// Get one normal suggestion with translation
export async function suggestExpressionHelper({
  detectedLang,
  outputLang,
  setTranslatedText,
  setInputTextLang,
  setTranslatedTextLang,
  setExplanation,
  setIsLoading,
  setIsFavorite,
  setTranslationId,
  setError,
  fetcher = fetch,
  promptGetter = getSuggestionPrompt,
  responseCleaner = cleanGeminiResponse,
}: SuggestionHelperArgs): Promise<SuggestionResult<string[]>> {
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
    const res = await fetcher("/api/gemini/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, isSuggestion: true }),
    });

    if (res.status === 429) {
      const { error } = await res.json();
      setError(error);
      setIsLoading(false);
      return { success: false, error };
    }

    if (!res.ok) throw new Error(`Gemini error: ${res.status}`);

    const { text } = await res.json();
    const translationArray = JSON.parse(responseCleaner(text));

    setTranslatedText(translationArray);
    setIsLoading(false);

    return { success: true, data: translationArray };
  } catch (err) {
    console.error(err);
    const errorMsg = "Internal server error... please try again 🙏";
    setError(errorMsg);
    setIsLoading(false);
    return { success: false, error: errorMsg };
  }
}

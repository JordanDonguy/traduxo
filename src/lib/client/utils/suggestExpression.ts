import { getSuggestionPrompt } from "@/lib/shared/geminiPrompts";
import { cleanGeminiResponse } from "./cleanGeminiResponse";

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
}: SuggestionHelperArgs) {

  // Blur the active element (input) immediately on submit to close mobile keyboard
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  };

  setIsLoading(true);
  setError("");
  setTranslatedText([]);
  setExplanation("");
  setIsFavorite(false);
  setTranslationId(undefined);

  setInputTextLang(detectedLang);
  setTranslatedTextLang(outputLang);

  const prompt = getSuggestionPrompt({ detectedLang, outputLang });

  const res = await fetch("/api/gemini/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  if (res.status === 429) {
    const { error } = await res.json();
    setError(error);
    setIsLoading(false);
    return;
  }
  if (!res.ok) throw new Error(`Gemini error: ${res.status}`);

  const { text } = await res.json();
  const translationArray = JSON.parse(cleanGeminiResponse(text));

  setTranslatedText(translationArray);
  setIsLoading(false);
}

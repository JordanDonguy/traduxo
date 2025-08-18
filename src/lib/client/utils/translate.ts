import { getTranslationPrompt } from "@/lib/shared/geminiPrompts";
import { cleanGeminiResponse } from "./cleanGeminiResponse";

type TranslateHelperArgs = {
  inputText: string;
  inputLang: string;
  outputLang: string;
  setInputText: React.Dispatch<React.SetStateAction<string>>;
  setInputTextLang: React.Dispatch<React.SetStateAction<string>>;
  setTranslatedTextLang: React.Dispatch<React.SetStateAction<string>>;
  setTranslatedText: React.Dispatch<React.SetStateAction<string[]>>;
  setExplanation: React.Dispatch<React.SetStateAction<string>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setIsFavorite: React.Dispatch<React.SetStateAction<boolean>>;
  setTranslationId: React.Dispatch<React.SetStateAction<string | undefined>>;
  setError: React.Dispatch<React.SetStateAction<string>>;
};

// Handle a translation request to Gemini

export async function translationHelper({
  inputText,
  inputLang,
  outputLang,
  setInputText,
  setInputTextLang,
  setTranslatedTextLang,
  setTranslatedText,
  setExplanation,
  setIsLoading,
  setIsFavorite,
  setTranslationId,
  setError,
}: TranslateHelperArgs) {
  // Blur active element to close mobile keyboard
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }

  if (!inputText.length) return;

  setIsLoading(true);
  setError("");
  setTranslatedText([]);
  setExplanation("");
  setIsFavorite(false);
  setTranslationId(undefined);

  const prompt = getTranslationPrompt({ inputText, inputLang, outputLang });
  setInputText("");

  const res = await fetch("/api/gemini/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, isSuggestion: false }),
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

  if (inputLang === "auto") {
    // Assume last element contains detected language
    setInputTextLang(translationArray[translationArray.length - 1]);
  } else {
    setInputTextLang(inputLang);
  }

  setTranslatedTextLang(outputLang);
  setTranslatedText(translationArray);
  setIsLoading(false);
}

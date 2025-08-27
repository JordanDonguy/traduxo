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
  // Injected dependencies for testing
  fetcher?: typeof fetch;
  promptGetter?: typeof getTranslationPrompt;
  responseCleaner?: typeof cleanGeminiResponse;
};

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
  fetcher = fetch,
  promptGetter = getTranslationPrompt,
  responseCleaner = cleanGeminiResponse,
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
    const res = await fetcher("/api/gemini/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, isSuggestion: false }),
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

    if (inputLang === "auto") {
      setInputTextLang(translationArray[translationArray.length - 1]);
    } else {
      setInputTextLang(inputLang);
    }

    setTranslatedTextLang(outputLang);
    setTranslatedText(translationArray);
    setIsLoading(false);

    return { success: true, data: translationArray };
  } catch (err: unknown) {
    console.error(err);
    const errorMsg = "Internal server error... please try again 🙏";
    setError(errorMsg);
    setIsLoading(false);
    return { success: false, error: errorMsg };
  }
}

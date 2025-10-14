import { useState } from "react";
import { useTranslationContext } from "@traduxo/packages/contexts/TranslationContext";
import { useLanguageContext } from "@traduxo/packages/contexts/LanguageContext";
import { getExplanationPrompt as defaultGetExplanationPrompt } from "@traduxo/packages/utils/geminiPrompts";
import { decodeTextStream } from "@traduxo/packages/utils/formatting/decodeTextStream";
import { API_BASE_URL } from "@traduxo/packages/utils/config/apiBase";
import { createReader } from "@traduxo/packages/utils/config/createReader";

// Injected dependencies for testing
type UseExplanationArgs = {
  fetcher?: typeof fetch;
  getExplanationPrompt?: typeof defaultGetExplanationPrompt;
};

export function useExplanation({
  fetcher = fetch,
  getExplanationPrompt = defaultGetExplanationPrompt,
}: UseExplanationArgs) {
  // ---- Step 1: Local loading + error states ----
  const [isExpLoading, setIsExpLoading] = useState(false);
  const [explanationError, setExplanationError] = useState("");

  // ---- Step 2: Contexts ----
  const {
    translatedText,
    setExplanation,
    inputTextLang,
    translatedTextLang,
  } = useTranslationContext();

  const { systemLang } = useLanguageContext();

  // ---- Step 3: Explanation handler ----
  async function handleExplanation() {
    // ---- Step 3a: Start loading & reset errors ----
    setIsExpLoading(true);
    setExplanationError("");
    setExplanation("");

    try {
      // ---- Step 3b: Generate prompt ----
      const prompt = getExplanationPrompt({
        inputTextLang,
        translatedTextLang,
        translatedText,
        systemLang,
      });

      // ---- Step 3c: Fetch streaming response if reader's not provided ----
      let usedReader: { read: () => Promise<{ done: boolean; value?: Uint8Array }> };

      const res = await fetcher(`${API_BASE_URL}/gemini/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, mode: "explanation" }),
      });

      if (res.status === 429) {
        const data = await res.json();
        setExplanationError(data.error);
        return false;
      }
      if (!res.ok) throw new Error(`Gemini error: ${res.status}`);

      // ---- Step 3d: Get streaming reader ----
      if (res.body) {
        usedReader = res.body.getReader(); // real streaming (browser)
      } else {
        usedReader = await createReader(res); // React Native fake reader fallback
      }

      // ---- Step 4: decode streamed response ----
      for await (const chunk of decodeTextStream(usedReader)) {
        setExplanation((prev) => prev + chunk);
      }

      return true;
    } catch (err: unknown) {
      console.error(err);
      const errorMsg = "Oops! Something went wrong on our server.\nPlease try again in a few moments 🙏";
      setExplanationError(errorMsg);
      return false;
    } finally {
      // ---- Step 3f: Stop loading ----
      setIsExpLoading(false);
    }
  }

  // ---- Step 4: Return handler + states ----
  return { handleExplanation, isExpLoading, setIsExpLoading, explanationError, setExplanationError };
}

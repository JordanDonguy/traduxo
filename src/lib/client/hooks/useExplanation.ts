"use client"

import { useState } from "react";
import { useTranslationContext } from "@/context/TranslationContext";
import { useLanguageContext } from "@/context/LanguageContext";
import { getExplanationPrompt as defaultGetExplanationPrompt } from "@/lib/shared/geminiPrompts";

// Injected dependencies for testing
type UseExplanationArgs = {
  fetcher?: typeof fetch;
  getExplanationPrompt?: typeof defaultGetExplanationPrompt;
  documentRef?: Document; // for testing to mock document.activeElement
};

export function useExplanation({
  fetcher = fetch,
  getExplanationPrompt = defaultGetExplanationPrompt,
  documentRef,
}: UseExplanationArgs = {}) {
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
    // Use injected document for testing, or real document in browser, or undefined during SSR
    const doc = documentRef ?? (typeof document !== "undefined" ? document : undefined);

    // Blur active element to close mobile keyboard
    if (doc?.activeElement instanceof HTMLElement) {
      doc.activeElement.blur();
    }

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

      // ---- Step 3c: Fetch streaming response ----
      const res = await fetcher("/api/gemini/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, mode: "explanation" }),
      });

      // ---- Step 3d: Handle 429 quota error ----
      if (res.status === 429) {
        const data = await res.json();
        setExplanationError(data.error);
        return false;
      }

      if (!res.ok || !res.body) throw new Error(`Gemini error: ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      // ---- Step 3e: Stream chunks ----
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
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
  return { handleExplanation, isExpLoading, explanationError, setExplanationError };
}

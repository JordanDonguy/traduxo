"use client"

import { createContext, useContext, useState, useEffect, useMemo, useRef, ReactNode } from "react";
import { useSession } from "next-auth/react";

type TranslationState = {
  inputText: string;
  translatedText: string[];
  inputTextLang: string;
  translatedTextLang: string;
  explanation: string;
  isLoading: boolean;
  error: string;
  expressionPool: string[];
  setInputText: React.Dispatch<React.SetStateAction<string>>;
  setTranslatedText: React.Dispatch<React.SetStateAction<string[]>>;
  setInputTextLang: React.Dispatch<React.SetStateAction<string>>;
  setTranslatedTextLang: React.Dispatch<React.SetStateAction<string>>;
  setExplanation: React.Dispatch<React.SetStateAction<string>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string>>;
  loadTranslationFromHistory: (t: TranslationHistory) => void;
  translationHistory: TranslationHistory[];
  setTranslationHistory: React.Dispatch<React.SetStateAction<TranslationHistory[]>>;
  setExpressionPool: React.Dispatch<React.SetStateAction<string[]>>;
};

type TranslationHistory = {
  id: string;
  inputText: string;
  translation: string;
  inputLang: string;
  outputLang: string;
  alt1: string | null;
  alt2: string | null;
  alt3: string | null;
};

// We use `TranslationState | undefined` as the type, and set the default value to `undefined`.
// This allows us to throw a helpful error if the context is used outside the provider.
const TranslationContext = createContext<TranslationState | undefined>(undefined);

export const TranslationProvider = ({ children }: { children: ReactNode }) => {
  const { status } = useSession();
  const [inputText, setInputText] = useState<string>("");
  const [translatedText, setTranslatedText] = useState<string[]>([]);

  const [inputTextLang, setInputTextLang] = useState<string>("");
  const [translatedTextLang, setTranslatedTextLang] = useState<string>("");

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const [explanation, setExplanation] = useState<string>("");

  const [translationHistory, setTranslationHistory] = useState<TranslationHistory[]>([]);
  const [expressionPool, setExpressionPool] = useState<string[]>([]);

  // This useRef is to skip saving translation to db if translation is loaded from history
  const isLoadingFromHistoryRef = useRef(false);
  function setLoadingFromHistory(value: boolean) {
    isLoadingFromHistoryRef.current = value;
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const translationSnapshot = useMemo(() => translatedText, [translatedText.length]);

  // Save translation do db
  useEffect(() => {
    // Skip saving translation to db if loaded from history
    if (isLoadingFromHistoryRef.current) {
      isLoadingFromHistoryRef.current = false;
      return;
    }

    // Only call saveTranslation if user is authenticated
    // And if there's valid translatedText (at least 2 translations) and valid languages
    if (
      status === "authenticated" &&
      translationSnapshot.length >= 2 &&
      inputTextLang.length === 2 &&
      translatedTextLang.length === 2
    ) {
      const saveTranslation = async () => {
        setIsLoading(true);
        setError("");

        try {
          const res = await fetch("/api/history", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              translations: translationSnapshot,
              inputLang: inputTextLang,
              outputLang: translatedTextLang,
            }),
          });

          if (!res.ok) {
            const data = await res.json();
            setError(data.error || "Failed to save translation");
          }
        } catch (err) {
          console.error(err);
          setError("Network error while saving translation");
        } finally {
          setIsLoading(false);
        }
      };
      saveTranslation();
    }
  }, [translationSnapshot, inputTextLang, translatedTextLang, status]);

  // Load a translation from user's history to main display
  function loadTranslationFromHistory(t: TranslationHistory) {
    setLoadingFromHistory(true)
    setExplanation("");
    setTranslatedText([t.inputText, t.translation, t.alt1 ?? "", t.alt2 ?? "", t.alt3 ?? ""]);
    setInputTextLang(t.inputLang);
    setTranslatedTextLang(t.outputLang);
  };

  return (
    <TranslationContext.Provider
      value={{
        inputText,
        translatedText,
        inputTextLang,
        translatedTextLang,
        explanation,
        isLoading,
        error,
        expressionPool,
        setInputText,
        setTranslatedText,
        setInputTextLang,
        setTranslatedTextLang,
        setExplanation,
        setIsLoading,
        setError,
        loadTranslationFromHistory,
        translationHistory,
        setTranslationHistory,
        setExpressionPool,
      }}
    >
      {children}
    </TranslationContext.Provider>
  );
};

// This checks if the context is `undefined` (i.e. used outside a <TranslationProvider>)
// and throws an error to help us catch the mistake early.
export const useTranslationContext = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error("useTranslationContext must be used inside a TranslationProvider");
  }
  return context;
};

"use client"

import { createContext, useContext, useState, ReactNode } from "react";

type TranslationState = {
  inputText: string;
  translatedText: string;
  isLoading: boolean;
  setInputText: (text: string) => void;
  setTranslatedText: (text: string) => void;
  setIsLoading: (loading: boolean) => void;
};

// We use `TranslationState | undefined` as the type, and set the default value to `undefined`.
// This allows us to throw a helpful error if the context is used outside the provider.
const TranslationContext = createContext<TranslationState | undefined>(undefined);

export const TranslationProvider = ({ children }: { children: ReactNode }) => {
  const [inputText, setInputText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  return (
    <TranslationContext.Provider
      value={{
        inputText,
        translatedText,
        isLoading,
        setInputText,
        setTranslatedText,
        setIsLoading,
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

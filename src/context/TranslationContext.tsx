"use client"

import { createContext, useContext, useState, ReactNode } from "react";

type TranslationState = {
  inputText: string;
  translatedText: string[];
  inputTextLang: string;
  translatedTextLang: string;
  isLoading: boolean;
  setInputText: React.Dispatch<React.SetStateAction<string>>;
  setTranslatedText: React.Dispatch<React.SetStateAction<string[]>>;
  setInputTextLang: React.Dispatch<React.SetStateAction<string>>;
  setTranslatedTextLang: React.Dispatch<React.SetStateAction<string>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
};

// We use `TranslationState | undefined` as the type, and set the default value to `undefined`.
// This allows us to throw a helpful error if the context is used outside the provider.
const TranslationContext = createContext<TranslationState | undefined>(undefined);

export const TranslationProvider = ({ children }: { children: ReactNode }) => {
  const [inputText, setInputText] = useState<string>("");
  const [translatedText, setTranslatedText] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [inputTextLang, setInputTextLang] = useState<string>("");
  const [translatedTextLang, setTranslatedTextLang] = useState<string>("");

  return (
    <TranslationContext.Provider
      value={{
        inputText,
        translatedText,
        inputTextLang,
        translatedTextLang,
        isLoading,
        setInputText,
        setTranslatedText,
        setInputTextLang,
        setTranslatedTextLang,
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

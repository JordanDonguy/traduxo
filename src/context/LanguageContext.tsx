"use client"

import { createContext, useContext, useState, ReactNode } from "react";

type LanguageState = {
  inputLang: string;
  outputLang: string;
  setInputLang: React.Dispatch<React.SetStateAction<string>>;
  setOutputLang: React.Dispatch<React.SetStateAction<string>>;
}

const LanguageContext = createContext<LanguageState | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [inputLang, setInputLang] = useState<string>("auto");
  const [outputLang, setOutputLang] = useState<string>("en");

  return (
    <LanguageContext.Provider
      value={{
        inputLang,
        outputLang,
        setInputLang,
        setOutputLang
      }}
    >
      {children}
    </LanguageContext.Provider>
  )
}

// This checks if the context is `undefined` (i.e. used outside a <LanguageProvider>)
// and throws an error to help us catch the mistake early.
export const useLanguageContext = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguageContext must be used inside a LanguageProvider");
  }
  return context;
};

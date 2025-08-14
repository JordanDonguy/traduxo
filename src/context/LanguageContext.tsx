"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useTranslationContext } from "./TranslationContext";
import { useSession } from "next-auth/react";

type LanguageState = {
  inputLang: string;
  outputLang: string;
  setInputLang: React.Dispatch<React.SetStateAction<string>>;
  setOutputLang: React.Dispatch<React.SetStateAction<string>>;
  detectedLang: string;
  systemLang: string;
  setSystemLang: React.Dispatch<React.SetStateAction<string>>;
}

const LanguageContext = createContext<LanguageState | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const { setExpressionPool } = useTranslationContext();
  const { data: session, status } = useSession();

  const [inputLang, setInputLang] = useState<string>("auto");
  const [outputLang, setOutputLang] = useState<string>("en");

  const browserLang = (typeof window !== "undefined"
    ? (navigator.language || navigator.languages?.[0] || "en").split("-")[0]
    : "en");

  const [systemLang, setSystemLang] = useState<string>(browserLang);

  const detectedLang =
    inputLang === "auto"
      ? systemLang
      : inputLang;

  // Whenever inputLang or outputLang changes, clear the expression pool
  useEffect(() => {
    setExpressionPool([]);
  }, [inputLang, outputLang, systemLang, setExpressionPool]);

  useEffect(() => {
    if (status === "authenticated") {
      if(session.user.systemLang) {
        setSystemLang(session.user.systemLang)
      }
    }
  }, [status, session?.user.systemLang])

  return (
    <LanguageContext.Provider
      value={{
        inputLang,
        outputLang,
        setInputLang,
        setOutputLang,
        detectedLang,
        systemLang,
        setSystemLang,
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

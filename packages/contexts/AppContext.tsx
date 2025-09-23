import React, { createContext, useContext, useState, ReactNode } from "react";
import { TranslationProvider } from "@traduxo/packages/contexts/TranslationContext";
import { LanguageProvider } from "@traduxo/packages/contexts/LanguageContext";
import { AuthProvider } from "./AuthContext";

export type AppContextType = {
  showLoginForm: boolean;
  setShowLoginForm: React.Dispatch<React.SetStateAction<boolean>>;
  error: string;
  setError: React.Dispatch<React.SetStateAction<string>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};

export function AppProviderBase({ children }: { children: ReactNode }) {
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  return (
    <AppContext.Provider
      value={{ showLoginForm, setShowLoginForm, error, setError, isLoading, setIsLoading }}
    >
      <AuthProvider>
        <TranslationProvider>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </TranslationProvider>
      </AuthProvider>
    </AppContext.Provider>
  );
}

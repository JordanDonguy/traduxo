'use client';
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { SessionProvider } from "next-auth/react";
import { TranslationProvider } from '@/context/TranslationContext';
import { LanguageProvider } from "@/context/LanguageContext";
import { ThemeProvider } from "next-themes";
import { ToastContainer } from "react-toastify";

// 1️⃣ Create AppContext
type AppContextType = {
  showLoginForm: boolean;
  setShowLoginForm: React.Dispatch<React.SetStateAction<boolean>>;
  error: string;
  setError: React.Dispatch<React.SetStateAction<string>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

// 2️⃣ Custom hook for convenience
export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};

// 3️⃣ AppProvider
export default function AppProvider({ children }: { children: ReactNode }) {
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  return (
    <AppContext.Provider
      value={{ showLoginForm, setShowLoginForm, error, setError, isLoading, setIsLoading }}
    >
      <ThemeProvider
        attribute="data-theme"
        defaultTheme="system"
        enableSystem
      >
        <SessionProvider>
          <TranslationProvider>
            <LanguageProvider>
              {children}
              <ToastContainer
                position="top-right"
                autoClose={4000}
                toastClassName="pointer-events-auto"
                className="!top-[70px] !z-10"
              />
            </LanguageProvider>
          </TranslationProvider>
        </SessionProvider>
      </ThemeProvider>
    </AppContext.Provider>
  );
}

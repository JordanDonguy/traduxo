"use client";

import { SessionProvider } from "next-auth/react";
import { TranslationProvider } from '@/context/TranslationContext';
import { LanguageProvider } from "@/context/LanguageContext";
import { ThemeProvider } from "next-themes";
import { ToastContainer } from "react-toastify";

export default function AppProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProvider
      attribute="data-theme"    /* puts data-theme="light|dark" on <html> */
      defaultTheme="system"     /* follow OS by default */
      enableSystem              /* let users return to “system” */
    >

      <SessionProvider>
        <LanguageProvider>
          <TranslationProvider>
            {children}
            <ToastContainer
              position="top-right"
              autoClose={4000}
              toastClassName="pointer-events-auto"
              className="!top-[70px] !z-10"
            />
          </TranslationProvider>
        </LanguageProvider>
      </SessionProvider>

    </ThemeProvider>
  )
}
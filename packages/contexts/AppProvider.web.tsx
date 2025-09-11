"use client";
import { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { ToastContainer } from "react-toastify";
import { AppProviderBase } from "@traduxo/packages/contexts/AppContext";

export default function AppProvider({ children }: { children: ReactNode }) {
  return (
    <AppProviderBase>
      <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
          {children}
          <ToastContainer
            position="top-right"
            autoClose={4000}
            toastClassName="pointer-events-auto"
            className="!top-[70px] !z-10"
          />
      </ThemeProvider>
    </AppProviderBase>
  );
}

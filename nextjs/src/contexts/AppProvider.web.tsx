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
            toastStyle={{ backgroundColor: "var(--btn)", border: "2px solid var(--border)", color: "var(--text)", borderRadius: "6px" }}
            className="!top-[70px] !z-30"
          />
      </ThemeProvider>
    </AppProviderBase>
  );
}

"use client"

import AppHeaderSuspenseWrapper from "@/components/menu/AppHeaderSuspenseWrapper";
import MainDisplay from "@/components/main-section/MainDisplay";
import TranslatorInput from "@/components/translator/TranslatorInput";
import { useApp } from "@traduxo/packages/contexts/AppContext";

export default function Home() {
  const { showMenu } = useApp();

  return (
    <div className={`min-h-[100svh] max-h-screen flex flex-col items-center w-full bg-[var(--bg)] ${showMenu ? "overflow-y-auto" : "overflow-y-scroll"}`}>

      <AppHeaderSuspenseWrapper />

      <main className="flex flex-col justify-center items-center w-full flex-1">
      
        <MainDisplay />
        <TranslatorInput />
      </main>

      <footer className="w-4xl z-10 hidden fixed bottom-0 bg-[var(--bg)] lg:block text-center text-xs text-[var(--input-placeholder)] h-16 pt-10 pb-2">
        Traduxo might not always be 100% accurate — use your best judgment!
      </footer>
    </div>
  );
}

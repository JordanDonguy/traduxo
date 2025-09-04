import AppHeaderSuspenseWrapper from "@/components/menu/AppHeaderSuspenseWrapper";
import MainDisplay from "@/components/main-section/MainDisplay";
import TranslatorInput from "@/components/translator/TranslatorInput";

export default function Home() {
  return (
    <div className="min-h-[100svh] flex flex-col items-center w-full bg-[var(--bg)]">

      <AppHeaderSuspenseWrapper />

      <main className="flex flex-col justify-center items-center w-full flex-1">
        <h1 className="sr-only">Traduxo – AI-Powered Translations and Expression Suggestions</h1>
        <MainDisplay />
        <TranslatorInput />
      </main>

      <footer className="w-full z-10 hidden fixed bottom-0 bg-[var(--bg)] lg:block text-center text-xs text-[var(--input-placeholder)] h-16 pt-10 pb-2">
        Traduxo might not always be 100% accurate — use your best judgment!
      </footer>
    </div>
  );
}

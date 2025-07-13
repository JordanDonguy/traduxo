import AppHeader from "@/components/AppHeader";
import MainDisplay from "@/components/MainDisplay";
import TranslatorInput from "@/components/TranslatorInput";

export default function Home() {
  return (
    <div className="min-h-[100svh] flex flex-col items-center w-full bg-[var(--bg)]">

      <AppHeader />

      <main className="flex flex-col justify-center items-center w-full flex-1">
        <MainDisplay />
        <TranslatorInput />
      </main>

      <footer className="w-full hidden lg:block text-center text-xs text-zinc-400 h-6 pb-2">
        Smart Translator might not always be 100% accurate — use your best judgment!
      </footer>
    </div>
  );
}

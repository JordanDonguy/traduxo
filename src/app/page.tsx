import AppHeader from "@/components/AppHeader";
import MainDisplay from "@/components/MainDisplay";
import TranslatorInput from "@/components/TranslatorInput";

export default function Home() {
  return (
    <div className="min-h-[100svh] flex flex-col items-center w-full bg-zinc-950">

      <AppHeader />

      <main className="flex flex-col justify-center items-center w-full flex-1">
        <MainDisplay />
        <TranslatorInput />
      </main>

      <footer className="w-full text-center text-xs text-zinc-400 mt-12 pb-2">
        Smart Translator might not always be 100% accurate — use your best judgment!
      </footer>
    </div>
  );
}

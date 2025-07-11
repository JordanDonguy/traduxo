import AppHeader from "@/components/AppHeader";
import MainDisplay from "@/components/MainDisplay";
import TranslatorInput from "@/components/TranslatorInput";

export default function Home() {
  return (
    <div className="min-h-[100svh] flex flex-col items-center w-full">

      <AppHeader />

      <main className="flex flex-col items-center w-full flex-1">
        <MainDisplay />
        <TranslatorInput />
      </main>

    </div>
  );
}

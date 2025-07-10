import MainDisplay from "@/components/MainDisplay";
import TranslatorInput from "@/components/TranslatorInput";

export default function Home() {
  return (
    <div className="">

      <header></header>

      <main className="min-h-[100svh] flex flex-col items-center w-full">
        <MainDisplay />
        <TranslatorInput />
      </main>

    </div>
  );
}

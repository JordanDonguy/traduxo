import MainDisplay from "@/components/main-section/MainDisplay";

export default function Home() {
  return (
    <div className="min-h-[100svh] max-h-screen flex flex-col items-center w-full bg-[var(--bg)] overflow-y-scroll">

      <main className="flex flex-col items-center w-full flex-1">
        <MainDisplay />
      </main>

    </div>
  );
}

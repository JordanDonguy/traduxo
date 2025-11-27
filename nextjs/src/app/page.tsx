import MainDisplay from "@/components/main-section/MainDisplay";

export default function Home() {
  return (
      <main className="min-h-[100svh] flex flex-col items-center w-full flex-1 max-h-screen overflow-y-scroll">
        <MainDisplay />
      </main>
  );
}

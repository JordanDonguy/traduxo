import MainDisplay from "@/components/main-section/MainDisplay";

export default function Home() {
  return (
      <main className="min-h-[100svh] flex flex-col items-center w-full flex-1 md:max-h-screen md:overflow-y-scroll">
        <MainDisplay />
      </main>
  );
}

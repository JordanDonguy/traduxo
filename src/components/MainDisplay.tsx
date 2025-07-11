"use client"

import { useTranslationContext } from "@/context/TranslationContext";

function MainDisplay() {
  const { translatedText, isLoading } = useTranslationContext();

  return (
    <section className="relative flex flex-col justify-center items-center w-full flex-1 bg-zinc-950">

      {isLoading ?
        <p>Loading...</p>
        : ""
      }
      {!translatedText && !isLoading ?
        <h2 className="text-4xl text-center max-w-5/6 mb-40 xl:mb-50">What do you need to translate today?</h2>
        : ""
      }
    </section>
  )
}

export default MainDisplay

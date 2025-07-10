"use client"

import { useTranslationContext } from "@/context/TranslationContext";

function MainDisplay() {
  const { translatedText, isLoading } = useTranslationContext();

  return (
    <section className="flex flex-col justify-center items-center w-full h-full min-h-[100svh] bg-neutral-900">
      {isLoading ?
        <p>Loading...</p>
        : ""
      }
      {!translatedText && !isLoading ?
        <h2 className="text-4xl text-center max-w-5/6 mb-25">What do you need to translate today?</h2>
        : ""
      }
    </section>
  )
}

export default MainDisplay

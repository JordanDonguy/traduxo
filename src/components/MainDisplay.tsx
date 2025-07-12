"use client"

import { useTranslationContext } from "@/context/TranslationContext";
import { useState, useEffect } from "react";

function MainDisplay() {
  const { translatedText, setTranslatedText, inputTextLang, translatedTextLang, isLoading } = useTranslationContext();
  const [mounted, setMounted] = useState<boolean>(false);
  const [fading, setFading] = useState<number[]>([]);

  // This is used to make a css translating effect when component mounts
  useEffect(() => {
    if (translatedText.length) {
      setMounted(true);
    } else {
      setMounted(false);
    }
  }, [translatedText]);

  function capitalizeFirstLetter(str: string): string {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  function switchTranslations(idx: number) {
    const altIdx = idx + 2;   // Get the proper index from the alts array (the array is translatedText.slice(2))

    setFading([1, altIdx]);   // Starts fading effect on translations to be switched

    // Switch translations only after 300ms (to allow time for the fading effect)
    setTimeout(() => {
      setTranslatedText((prev) => {
        const updated = [...prev];
        const temp = updated[altIdx];
        updated[altIdx] = updated[1];
        updated[1] = temp;
        return updated;
      });
      setFading([])
    }, 200)
  }

  return (
    <section className={`relative flex flex-col items-center w-full duration-500 mb-40 lg:mb-56 ${!translatedText.length ? "justify-center" : "justify-start"}`}>

      {isLoading ? (
        <p>Loading…</p>
      ) : translatedText.length === 0 ? (
        <h2 className="text-4xl text-center w-[85%]">
          What do you need to translate today?
        </h2>
      ) : (
        <div className="w-full max-w-[96%] sm:max-w-xl lg:max-w-3xl flex flex-col gap-8 mt-8 md:mt-12">
          <article className={`flex gap-4 pr-4 bg-zinc-800 rounded-md duration-500 ease-in-out transform ${mounted ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"}`}>
            <p className="flex justify-center w-10 h-8 p-1 border border-zinc-400 rounded-md">{inputTextLang.length <= 2 ? inputTextLang?.toUpperCase() : ""}</p>
            <p className="text-xl min-h-8 flex items-center">{capitalizeFirstLetter(translatedText[0])}</p>
          </article>

          <article className={`flex flex-col gap-2 bg-zinc-800 rounded-md delay-500 duration-500 ease-in-out transform ${mounted ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"}`}>
            <div className="flex gap-4 pr-4 mb-2">
              <p className="flex justify-center w-10 h-8 p-1 border border-zinc-400 rounded-md">{translatedTextLang.length <= 2 ? translatedTextLang?.toUpperCase() : ""}</p>
              <p className={`text-xl min-h-8 flex items-center duration-200 ${fading.includes(1) ? "opacity-0" : "opacity-100"}`}>{capitalizeFirstLetter(translatedText[1])}</p>
            </div>
            <ul className="pl-18 pr-4 pb-4 flex flex-col gap-2">
              {translatedText.slice(2).map((alt, idx) => (
                alt.length > 2 ?
                  <li
                    key={idx}
                    onClick={() => switchTranslations(idx)}
                    className={`list-disc duration-200 ${fading.includes(idx + 2) ? "opacity-0" : "opacity-100"} hover:text-zinc-400 hover:cursor-pointer`}
                  >
                    {capitalizeFirstLetter(alt)}
                  </li>
                  : ""
              ))}
            </ul>
          </article>

          <div
            className={`flex justify-center items-center flex-1 w-full self-center duration-500 ease-in-out
            transform ${mounted ? "delay-1000 scale-x-100 opacity-100" : "scale-x-0 opacity-0"}`}
          >
            <button className={`w-full max-w-xl py-4 rounded-full border border-zinc-400 bg-zinc-900 hover:cursor-pointer hover:bg-zinc-700 active:scale-90 duration-100`}>
              ✨ AI explanations
            </button>
          </div>
        </div>
      )
      }
    </section>
  )
}

export default MainDisplay

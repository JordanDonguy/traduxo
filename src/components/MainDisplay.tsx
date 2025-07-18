"use client"

import { useTranslationContext } from "@/context/TranslationContext";
import { useState, useEffect } from "react";
import ReactMarkdown from 'react-markdown';
import LoadingAnimation from "./LoadingAnimation";
import { getExplanationPrompt } from "@/utils/geminiPrompts";
import { quoteToBold } from "@/utils/quoteToBold";

function MainDisplay() {
  const { translatedText, setTranslatedText, inputTextLang, translatedTextLang, explanation, setExplanation, isLoading, error } = useTranslationContext();
  const [mounted, setMounted] = useState<boolean>(false);
  const [ready, setReady] = useState<boolean>(false);


  const [fading, setFading] = useState<number[]>([]);                 // To be used when switching translations (fading effect)
  const [isExpLoading, setIsExpLoading] = useState<boolean>(false);   // To display a loading animation when explanation's loading
  const [explanationError, setExplanationError] = useState<string>(""); // Display error message if any when requesting explanation

  // This is used to make a css translating effect when component mounts
  // The delay is then removed to prevent late color switching when switching light / dark theme
  useEffect(() => {
    if (isLoading) {
      setMounted(false);
      setReady(false);
    } else if (translatedText.length) {
      const timeoutMounted = setTimeout(() => setMounted(true), 10)
      const timeoutReady = setTimeout(() => setReady(true), 1000);
      return () => {
        clearTimeout(timeoutMounted);
        clearTimeout(timeoutReady);
      }
    } else {
      setMounted(false);
      setReady(false);
    }
  }, [translatedText, isLoading]);

  function capitalizeFirstLetter(str: string): string {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // Function to switch between main translation and an alt
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
  };

  async function handleButton() {
    // Blur the active element (input) immediately on submit to close mobile keyboard
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    };

    // Trigger loading animation, reset errors state if any
    setIsExpLoading(true);
    setExplanationError("");

    const prompt = getExplanationPrompt({ inputTextLang, translatedTextLang, translatedText });

    const res = await fetch('/api/gemini/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    // Set an error message to display then to user if 429 error is returned (quota exceeded)
    if (res.status === 429) {
      const { error } = await res.json();
      setExplanationError(error);
      return
    };

    if (!res.ok || !res.body) throw new Error(`Gemini error: ${res.status}`);

    const reader = res.body.getReader();      // Streaming response reader
    const decoder = new TextDecoder();        // Binary chunk decoder

    // Adds a slight delay to make Gemini's streamed response appear more naturally.
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    // Make a loop that adds decoded chunk to explanation for as long as streaming's on
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // decode chunk and add it to explanation state
      // Sometimes Gemini uses quotes instead of bold, so I use a little utils function to fix that (quoteToBold)
      const chunk = quoteToBold(decoder.decode(value, { stream: true }));
      setExplanation(prev => prev + chunk);
      await delay(10); // Delay slightly Gemini's streamed response
    }
    setIsExpLoading(false);
  }

  return (
    <section className={`relative flex flex-col items-center w-full duration-500 mb-40 lg:mb-56 ${!translatedText.length ? "justify-center" : "justify-start"}`}>

      {error.length ? (
        <p className="text-2xl/10 text-center whitespace-pre-line">{error}</p>
      ) : isLoading ? (
        <LoadingAnimation />
      ) : translatedText.length === 0 ? (
        <h2 className="text-4xl text-center w-[85%]">
          What do you need to translate today?
        </h2>
      ) : (
        <div className={`w-full max-w-[96%] sm:max-w-xl lg:max-w-3xl flex flex-col ${explanation.length > 200 ? "mt-20 md:mt-24" : "mt-8 md:mt-12"}`}>
          <article className={`flex gap-4 pr-4 bg-[var(--bg-2)] mb-8 rounded-md duration-500 ease-in-out transform font-semibold ${mounted ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"}`}>
            <p className="flex shrink-0 justify-center w-10 h-8 p-1 border border-zinc-400 rounded-md">{inputTextLang.length <= 2 ? inputTextLang?.toUpperCase() : ""}</p>
            <p className="text-xl min-h-8 flex items-center">{capitalizeFirstLetter(translatedText[0])}</p>
          </article>

          <article className={`flex flex-col gap-2 bg-[var(--bg-2)] rounded-md duration-500 ease-in-out transform
            ${mounted
              ? (ready ? "translate-x-0 opacity-100" : "delay-500 translate-x-0 opacity-100")
              : "-translate-x-full opacity-0"}`}
          >
            <div className="flex gap-4 pr-4 mb-2 font-semibold">
              <p className="flex shrink-0 justify-center w-10 h-8 p-1 border border-zinc-400 rounded-md">{translatedTextLang.length <= 2 ? translatedTextLang?.toUpperCase() : ""}</p>
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

          {explanationError.length ? (
            <p className="text-2xl/10 text-center whitespace-pre-line mt-8">{explanationError}</p>
          ) : explanation.length ? (
            <div className="flex-1 flex flex-col justify-center explanation mt-12 mb-4">
              <ReactMarkdown>{explanation}</ReactMarkdown>
            </div>
          ) : isExpLoading ? (
            <div className="flex justify-center items-center w-full h-[58px] mt-8">
              <LoadingAnimation />
            </div>
          ) : (
            <div
              className={`flex justify-center items-center flex-1 w-full self-center duration-500 ease-in-out transform mt-8
              ${mounted
                  ? (ready ? "scale-x-100 opacity-100" : "delay-1000 scale-x-100 opacity-100")
                  : "scale-x-0 opacity-0"
                }`}
            >
              <button
                onClick={handleButton}
                className={`w-full max-w-xl py-4 rounded-full border border-zinc-400 bg-[var(--btn)] hover:cursor-pointer hover:bg-[var(--hover)] active:scale-90 duration-100`}
              >
                ✨ AI explanations
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

export default MainDisplay

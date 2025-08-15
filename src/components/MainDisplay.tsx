"use client"

import { useTranslationContext } from "@/context/TranslationContext";
import { useLanguageContext } from "@/context/LanguageContext";
import { useState, useEffect } from "react";
import ReactMarkdown from 'react-markdown';
import LoadingAnimation from "./LoadingAnimation";
import { getExplanationPrompt } from "@/lib/shared/geminiPrompts";
import { useRouter } from "next/navigation";
import { showAuthToasts } from "@/lib/client/utils/authToasts";
import { Star } from "lucide-react";
import { addToFavorite, deleteFromFavorite } from "@/lib/client/utils/favorites";
import { useCooldown } from "@/lib/client/hooks/useCooldown";
import LandingDisplay from "./LandingDisplay";
import { toast } from "react-toastify";

function MainDisplay() {
  const {
    translatedText,
    setTranslatedText,
    inputTextLang,
    translatedTextLang,
    explanation,
    setExplanation,
    isLoading,
    isFavorite,
    setIsFavorite,
    translationId,
    setTranslationId,
    error,
    setError
  } = useTranslationContext();
  const { systemLang } = useLanguageContext();
  const [mounted, setMounted] = useState<boolean>(false);
  const [ready, setReady] = useState<boolean>(false);
  const router = useRouter();

  const [fading, setFading] = useState<number[]>([]);                 // To be used when switching translations (fading effect)
  const [isExpLoading, setIsExpLoading] = useState<boolean>(false);   // To display a loading animation when explanation's loading
  const [explanationError, setExplanationError] = useState<string>(""); // Display error message if any when requesting explanation
  const [isFavLoading, setIsFavLoading] = useState<boolean>(false);   // To prevent user spamming add to favorite button


  const cooldown = useCooldown(error.startsWith("Too many requests"));  // Starts a cooldown if rateLimiter error

  // Reset error state when cooldown arrives at 0 if rateLimiting error
  useEffect(() => {
    if (cooldown === 0 && error.startsWith("Too many requests")) {
      setError("")
    }
  }, [cooldown, error, setError]);


  // Display a toast message if there's an error or success message in url params
  useEffect(() => {
    showAuthToasts(router)
  }, [router])

  useEffect(() => {
    const paragraphs = document.querySelectorAll('p');
    paragraphs.forEach(p => {
      p.innerHTML = p.innerHTML
        // Replace double quotes
        .replace(/"([^"]+)"/g, '<strong>$1</strong>')
        // Replace french style quotes
        .replace(/«([^»]+)»/g, '<strong>$1</strong>');
    });
  }, [explanation.length]);

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

    const prompt = getExplanationPrompt({ inputTextLang, translatedTextLang, translatedText, systemLang });

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

    // Make a loop that adds decoded chunk to explanation for as long as streaming's on
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // decode chunk and add it to explanation state
      // Sometimes Gemini uses quotes instead of bold, so I use a little utils function to fix that (quoteToBold)
      const chunk = decoder.decode(value, { stream: true });
      setExplanation(prev => prev + chunk);
    }
    setIsExpLoading(false)
  };

  // Add or delete a translation from favorite
  async function handleFavorite() {
    if (isFavLoading) return; // prevent double click
    setIsFavLoading(true);

    try {
      if (isFavorite) {
        await deleteFromFavorite(translationId, setTranslationId, setIsFavorite);
      } else {
        const res = await addToFavorite(
          translatedText,
          inputTextLang,
          translatedTextLang,
          setTranslationId,
          setIsFavorite
        );
        if (res) toast.error(res);
      }
    } finally {
      setIsFavLoading(false);
    }
  }

  return (
    <section className={`relative flex flex-col items-center w-full duration-500 mb-40 lg:mb-56 ${!translatedText.length ? "justify-center" : "justify-start"}`}>
      {error.length ? (
        <div className="flex flex-col gap-2">
          <p className="text-2xl/10 text-center whitespace-pre-line px-4 md:px-0">
            {error}
          </p>
          {cooldown ? (
            <p className="text-2xl/10 text-center whitespace-pre-line px-4 md:px-0">
              Try again in 0:{String(cooldown).padStart(2, "0")} 🙏
            </p>
          ) : null}
        </div>
      ) : isLoading ? (
        <LoadingAnimation />
      ) : translatedText.length === 0 ? (
        <LandingDisplay />
      ) : (
        <div className={`w-full max-w-[96%] sm:max-w-xl lg:max-w-3xl flex flex-col ${explanation.length > 10 ? "mt-20 md:mt-24" : "mt-12"}`}>

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
              <button
                onClick={handleFavorite}
                disabled={isFavLoading}
                className={`absolute right-4 mt-1 text-[var(--input-placeholder)]
                  hover:cursor-pointer hover:text-[var(--text)]
                  ${isFavLoading ? "pointer-events-none text-gray-400" : ""}
                `}
              >
                <Star fill={isFavorite ? "currentColor" : "transparent"} />
              </button>
              <p className="flex shrink-0 justify-center w-10 h-8 p-1 border border-zinc-400 rounded-md">{translatedTextLang.length <= 2 ? translatedTextLang?.toUpperCase() : ""}</p>
              <p className={`text-xl max-w-3/4 min-h-8 flex items-center duration-200 ${fading.includes(1) ? "opacity-0" : "opacity-100"}`}>{capitalizeFirstLetter(translatedText[1])}</p>
            </div>
            <ul className="pl-18 pr-4 pb-4 flex flex-col gap-2">
              {translatedText.slice(2).map((alt, idx) => (
                alt.length > 2 ?
                  <li
                    key={idx}
                    onClick={() => switchTranslations(idx)}
                    className={`list-disc w-fit duration-200 ${fading.includes(idx + 2) ? "opacity-0" : "opacity-100"} hover:text-zinc-400 hover:cursor-pointer`}
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
                className={`w-full max-w-xl py-4 rounded-full border border-[var(--input-placeholder)] bg-[var(--btn)] hover:cursor-pointer hover:bg-[var(--hover)] active:scale-90 duration-100`}
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

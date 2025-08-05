"use client"

import { useState } from "react";
import UserMenu from "./UserMenu";
import { useLanguageContext } from "@/context/LanguageContext";
import { useTranslationContext } from "@/context/TranslationContext";
import { getSuggestionPrompt } from "@/utils/geminiPrompts";
import { User, Dices } from "lucide-react";
import Logo from "./Logo";

function AppHeader() {
  const {
    setInputText,
    setTranslatedText,
    setInputTextLang,
    setTranslatedTextLang,
    setExplanation,
    setIsLoading,
    setError,
  } = useTranslationContext();

  const {
    outputLang,
    detectedLang
  } = useLanguageContext();

  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [alreadySuggested, setAlreadySuggested] = useState<string[]>([]);   // To prevent AI to suggest the same expression many times in a row

  const [isRolling, setIsRolling] = useState<boolean>(false);   // To trigger dices rolling animation (on click)

  async function suggestTranslation() {
    // Make the dices roll!
    setIsRolling(true);
    setTimeout(() => setIsRolling(false), 600); // Match animation duration

    setShowMenu(false);

    // Blur the active element (input) immediately on submit to close mobile keyboard
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    };

    // Set loading state to true
    setIsLoading(true);

    // Reset error, translatedText, explanation and inputText states
    setError("");
    setTranslatedText([]);
    setExplanation("");
    setInputText("");

    // Since suggesting from output to input, set translatedTextLang to detectedLang (input or browser default if on "auto")
    setTranslatedTextLang(detectedLang);

    const prompt = getSuggestionPrompt({ detectedLang, outputLang, alreadySuggested });

    // Gemini API request
    const res = await fetch('/api/gemini/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    // Set an error message to display then to user if 429 error is returned (quota exceeded)
    if (res.status === 429) {
      const { error } = await res.json();
      setError(error);
      setIsLoading(false)
      return
    };
    if (!res.ok) throw new Error(`Gemini error: ${res.status}`);

    const { text } = await res.json();

    const cleanedText = text
      .replace(/```json\s*/, '')  // remove opening ```json and any whitespace
      .replace(/[\s\n\r]*```+[\s\n\r]*$/, '')  // Remove trailing backticks with optional whitespace/newlines around

    const translationArray = JSON.parse(cleanedText);

    setInputTextLang(outputLang);   // Set inputTextLang to outputLang since suggesting from output to input language

    setTranslatedText(translationArray);
    setIsLoading(false);

    // Keep suggestion history < 20
    if (alreadySuggested.length >= 20) {
      setAlreadySuggested(prev => prev.slice(1));
    };
    // Add suggestion to alreadySuggested to prevent having the same one on next request
    setAlreadySuggested(prev => [...prev, translationArray[0]]);
  }

  return (
    <header className="w-full h-full flex justify-center">

      <UserMenu showMenu={showMenu} setShowMenu={setShowMenu} />

      <div className="z-30 fixed w-full max-w-6xl h-12 bg-[var(--bg-2)] rounded-b-4xl shadow-sm flex flex-row-reverse md:flex-row items-center justify-between px-4 xl:pl-8 xl:pr-6">
        <button
          onClick={suggestTranslation}
          className="md:hidden p-2 rounded-full hover:bg-[var(--hover)] hover:cursor-pointer"
        >
          <Dices className={`${isRolling ? "animate-dice-roll" : ""}`} />
        </button>

       <Logo />

        <div>
          <button
            onClick={suggestTranslation}
            className="hidden md:inline p-2 rounded-full hover:bg-[var(--hover)] hover:cursor-pointer text-[var(--text)]"
          >
            <Dices className={`${isRolling ? "animate-dice-roll" : ""}`} />
          </button>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-full hover:bg-[var(--hover)] hover:cursor-pointer text-[var(--text)]"
          >
            <User />
          </button>
        </div>
      </div>
    </header>
  )
}

export default AppHeader
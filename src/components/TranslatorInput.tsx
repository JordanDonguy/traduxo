"use client";

import { useState, useEffect, useRef } from "react";
import { useApp } from "@/context/AppContext";
import { useTranslationContext } from '@/context/TranslationContext';
import { useLanguageContext } from "@/context/LanguageContext";
import { createSpeechRecognition } from "@/lib/client/utils/speechRecognition";
import { translationHelper } from "@/lib/client/utils/translate";
import ISO6391 from "iso-639-1";
import { Mic, CircleStop, ArrowRightLeft } from "lucide-react";

function TranslatorInput() {
  const { setIsLoading, setError } = useApp();

  const {
    inputText,
    setInputText,
    setTranslatedText,
    setInputTextLang,
    setTranslatedTextLang,
    setExplanation,
    setIsFavorite,
    setTranslationId,
  } = useTranslationContext();

  const {
    inputLang,
    outputLang,
    setInputLang,
    setOutputLang,
    detectedLang
  } = useLanguageContext();

  // showWarning state to show a message if user tries to voice input with inputLand set to "auto"
  const [showWarning, setShowWarning] = useState<boolean>(false);
  // isListening state to show a different icon whether speechRecognition is on or not
  const [isListening, setIsListening] = useState<boolean>(false);

  // isSwitching state to trigger an animation when switching input/output languages
  const [isSwitching, setIsSwitching] = useState<boolean>(false);

  // Get all language codes supported by ISO6391
  const languageCodes = ISO6391.getAllCodes();

  // Handle translation request
  async function handleTranslate(e: React.FormEvent) {
    e.preventDefault();

    translationHelper({
      inputText,
      inputLang,
      outputLang,
      setInputText,
      setInputTextLang,
      setTranslatedTextLang,
      setTranslatedText,
      setExplanation,
      setIsLoading,
      setIsFavorite,
      setTranslationId,
      setError,
    })
  };

  // Handle voice input
  function handleVoice() {
    if (inputLang === "auto") {
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 4000);
      return;
    };

    const recognizer = createSpeechRecognition({
      lang: inputLang,
      onResult: (text) => {
        setInputText(text);
      },
      onError: (err) => {
        console.log("Speech error:", err);
      },
      onStop: () => {
        setIsListening(false)
      }
    });

    if (!recognizer) {
      alert("Voice input isn't supported on this browser, please use Chrome or any other compatible browser.");
      return
    }

    if (!isListening) {
      recognizer?.start();
      setIsListening(true);
    } else if (!inputText) {
      setIsListening(false)
      recognizer?.abort();
    } else {
      setIsListening(false);
      recognizer?.stop();
    }
  };

  // Set a timeout ref to use for languages switching animation
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Trigger switching animation
  const switchLanguage = () => {
    setIsSwitching(true);

    const temporaryLang = outputLang;
    if (inputLang === "auto") {
      setOutputLang(detectedLang);
    } else {
      setOutputLang(inputLang);
    }
    setInputLang(temporaryLang);
  };

  // Reset timeout after 80ms
  useEffect(() => {
    if (!isSwitching) return;

    timeoutRef.current = setTimeout(() => {
      setIsSwitching(false);
    }, 80);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isSwitching]);

  return (
    <div className="fixed z-20 bottom-0 lg:bottom-8 w-full max-w-xl lg:max-w-3xl h-40 sm:h-48 bg-[var(--bg-2)] shadow-sm rounded-t-4xl lg:rounded-4xl flex flex-col justify-between items-center py-4">

      {/* Language select section */}
      <section className="w-[90%] h-1/2 flex justify-between items-center">

        <div className={`${showWarning ? "scale-y-100 opacity-95" : "scale-y-0 opacity-0"} h-60 absolute bottom-35 md:bottom-40 md:left-28 p-2 bg-warning flex drop-shadow-lg duration-300 origin-bottom`}>
          <span className="max-w-40 block ml-8 mt-8 text-lg">You need to select a language to use voice input</span>
        </div>

        {/* Input language select */}
        <select
          value={inputLang}
          onChange={(e) => setInputLang(e.target.value)}
          onClick={() => setShowWarning(false)}
          className={`appearance-none w-2/5 bg-[var(--input)] h-12 rounded-2xl text-center
          hover:cursor-pointer hover:bg-[var(--hover)] focus:outline-none duration-100 origin-right ease-in-out
          ${isSwitching ? "translate-x-full  pointer-events-none" : "translate-x-0 opacity-100"}`}
        >
          <option value="auto">✨ Auto</option>
          {languageCodes.map((code) => (
            <option key={code} value={code}>
              {ISO6391.getName(code) || code}
            </option>
          ))}
        </select>

        <button
          onClick={switchLanguage}
          className="hover:cursor-pointer hover:text-[var(--input-placeholder)] active:scale-80 duration-100"
        >
          <ArrowRightLeft className="filter invert-15" />
        </button>

        {/* Output language select */}
        <select
          value={outputLang}
          onChange={(e) => setOutputLang(e.target.value)}
          className={`appearance-none w-2/5 bg-[var(--input)] h-12 rounded-2xl text-center
          hover:cursor-pointer hover:bg-[var(--hover)] focus:outline-none duration-100 origin-left  ease-in-out
          ${isSwitching ? "-translate-x-full  pointer-events-none" : "translate-x-0 opacity-100"}`}
        >
          {languageCodes.map((code) => (
            <option key={code} value={code}>
              {ISO6391.getName(code) || code}
            </option>
          ))}
        </select>
      </section>

      {/* User input section */}
      <section className="w-full h-1/2 flex items-center justify-center">
        <form
          onSubmit={handleTranslate}
          className="w-[90%] flex bg-[var(--input)] rounded-r-4xl rounded-l-2xl h-12 border border-[var(--input-border)] mt-2"
        >
          <input
            className="w-full h-full px-6 focus:outline-none"
            placeholder="Enter some text..."
            onChange={(e) => setInputText(e.target.value)}
            value={inputText}
            autoComplete="off"
            maxLength={100}
          />

          <button type="submit" className="sr-only">
            Translate
          </button>

          <button
            type="button"
            className="w-12 hover:cursor-pointer hover:bg-[var(--hover)] rounded-full flex justify-center items-center"
            onClick={handleVoice}
          >
            {!isListening ? <Mic /> : <CircleStop />}
          </button>
        </form>
        {inputText.length === 100 ? (
          <p className="text-sm absolute bottom-1 left-[5%] text-neutral-400 italic">100 characters max allowed</p>
        ) : ""}
      </section>
    </div>
  )
}

export default TranslatorInput;

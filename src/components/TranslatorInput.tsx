"use client";

import { useState } from "react";
import { useTranslationContext } from '@/context/TranslationContext';
import { useLanguageContext } from "@/context/LanguageContext";
import { createSpeechRecognition } from "@/lib/client/utils/speechRecognition";
import { translationHelper } from "@/lib/client/utils/translate";
import ISO6391 from "iso-639-1";
import { Mic, CircleStop, ArrowRight } from "lucide-react";

function TranslatorInput() {
  const {
    inputText,
    setInputText,
    setTranslatedText,
    setInputTextLang,
    setTranslatedTextLang,
    setExplanation,
    setIsLoading,
    setError,
  } = useTranslationContext();

  const {
    inputLang,
    outputLang,
    setInputLang,
    setOutputLang
  } = useLanguageContext();

  // showWarning state to show a message if user tries to voice input with inputLand set to "auto"
  const [showWarning, setShowWarning] = useState<boolean>(false);
  // isListening state to show a different icon whether speechRecognition is on or not
  const [isListening, setIsListening] = useState<boolean>(false);

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
      setError,
      setIsLoading,
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
          className="appearance-none w-2/5 bg-[var(--input)] h-12 rounded-2xl text-center hover:cursor-pointer hover:bg-[var(--hover)] focus:outline-none"
        >
          <option value="auto">✨ Auto</option>
          {languageCodes.map((code) => (
            <option key={code} value={code}>
              {ISO6391.getName(code) || code}
            </option>
          ))}
        </select>

        <ArrowRight />

        {/* Output language select */}
        <select
          value={outputLang}
          onChange={(e) => setOutputLang(e.target.value)}
          className="appearance-none w-2/5 bg-[var(--input)] h-12 rounded-2xl text-center hover:cursor-pointer hover:bg-[var(--hover)] focus:outline-none"
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
            maxLength={200}
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
        {inputText.length === 200 ? (
          <p className="text-sm absolute bottom-0 left-[5%] text-neutral-400 italic">200 characters max allowed</p>
        ) : ""}
      </section>
    </div>
  )
}

export default TranslatorInput;

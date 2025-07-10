"use client";

import { useState } from "react";
import { useTranslationContext } from '@/context/TranslationContext';
import { createSpeechRecognition } from "@/utils/speechRecognition";
import ISO6391 from "iso-639-1";
import { Mic, CircleStop, ArrowRight } from "lucide-react";

function TranslatorInput() {
  const {
    inputText,
    setInputText,
    setTranslatedText,
    setIsLoading,
  } = useTranslationContext();

  const [inputLang, setInputLang] = useState<string>("auto");
  const [outputLang, setOutputLang] = useState<string>("en");

  // showWarning state to show a message if user tries to voice input with inputLand set to "auto"
  const [showWarning, setShowWarning] = useState<boolean>(false);
  // isListening state to show a different icon whether speechRecognition is on or not
  const [isListening, setIsListening] = useState<boolean>(false);

  // Get all language codes supported by ISO6391
  const languageCodes = ISO6391.getAllCodes();

  function handleTranslate(e: React.FormEvent) {
    e.preventDefault();
    setShowWarning(false);
    setInputText("");
  }

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
      onStart: () => setIsListening(true),
      onEnd: () => setIsListening(false),
    });

    if (!isListening) {
      recognizer?.start();
    } else {
      recognizer?.stop();
    }
  }

  return (
    <div className="fixed bottom-0 lg:bottom-8 w-full max-w-xl lg:max-w-3xl h-40 sm:h-48 bg-neutral-800 rounded-t-4xl lg:rounded-4xl flex flex-col justify-between items-center py-4">

      {/* Language select section */}
      <section className="w-[90%] h-1/2 flex justify-between items-center">

        <div className={`${showWarning ? "scale-y-100 opacity-90" : "scale-y-0 opacity-0"} h-60 absolute bottom-35 md:bottom-40 md:left-28 p-2 bg-comment flex drop-shadow-lg duration-300 origin-bottom`}>
          <span className="max-w-40 block ml-8 mt-8 text-lg">You need to select a language to use voice input</span>
        </div>

        {/* Input language select */}
        <select
          value={inputLang}
          onChange={(e) => setInputLang(e.target.value)}
          onClick={() => setShowWarning(false)}
          className="appearance-none w-2/5 bg-zinc-950 h-12 rounded-2xl text-center hover:cursor-pointer hover:bg-zinc-700 focus:outline-none"
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
          className="appearance-none w-2/5 bg-zinc-950 h-12 rounded-2xl text-center hover:cursor-pointer hover:bg-zinc-700 focus:outline-none"
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
          className="w-[90%] flex bg-zinc-950 rounded-r-4xl rounded-l-2xl h-12 border border-neutral-700 mt-2"
        >
          <input
            className="w-full h-full px-6 focus:outline-none"
            placeholder="Enter some text..."
            onChange={(e) => setInputText(e.target.value)}
            value={inputText}
            autoComplete="off"
          />

          <button type="submit" className="sr-only">
            Translate
          </button>

          <button
            type="button"
            className="w-12 hover:cursor-pointer hover:bg-zinc-700 rounded-full flex justify-center items-center"
            onClick={handleVoice}
          >
            {!isListening ? <Mic /> : <CircleStop />}
          </button>
        </form>
      </section>
    </div>
  )
}

export default TranslatorInput;

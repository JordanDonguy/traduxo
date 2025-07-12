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
    setInputTextLang,
    setTranslatedTextLang,
    setIsLoading,
    setError,
  } = useTranslationContext();

  const [inputLang, setInputLang] = useState<string>("auto");
  const [outputLang, setOutputLang] = useState<string>("en");

  // showWarning state to show a message if user tries to voice input with inputLand set to "auto"
  const [showWarning, setShowWarning] = useState<boolean>(false);
  // isListening state to show a different icon whether speechRecognition is on or not
  const [isListening, setIsListening] = useState<boolean>(false);

  // Get all language codes supported by ISO6391
  const languageCodes = ISO6391.getAllCodes();

  // Handle translation request
  async function handleTranslate(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setTranslatedText([]);

    const prompt =
      `You will receive a user request that may include extra words such as
"Can you translate ... into ...".  
1. Identify the idiom or expression that needs translating
2. Translate the following English expression or idiom ${inputLang !== "auto" ? `from ${inputLang} ` : ""}into ${outputLang} in a natural and culturally appropriate way.
${inputLang === "auto" ? "3. Detect the ORIGINAL language of the extracted expression (two-letter ISO-639-1 code, lowercase)." : ""}

**Output**
${inputLang === "auto"
        ? `Return EXACTLY this JSON array (no markdown):
["expression", "main translation", "alternative 1", "alternative 2", "alternative 3", "orig-lang-code"]`
        : `Return EXACTLY this JSON array (no markdown):
["expression", "main translation", "alternative 1", "alternative 2", "alternative 3"]`}

**IMPORTANT:** Always return exactly one translation and 3 alternatives.

Expression: ${inputText}`;

    setInputText("");

    const res = await fetch('/api/gemini', {
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

    if (inputLang === "auto") {
      setInputTextLang(translationArray[translationArray.length - 1]);
    } else {
      setInputTextLang(inputLang)
    };
    setTranslatedTextLang(outputLang);

    setTranslatedText(translationArray);
    setIsLoading(false);
  }

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
  }

  return (
    <div className="fixed bottom-0 lg:bottom-8 w-full max-w-xl lg:max-w-3xl h-40 sm:h-48 bg-zinc-800 rounded-t-4xl lg:rounded-4xl flex flex-col justify-between items-center py-4">

      {/* Language select section */}
      <section className="w-[90%] h-1/2 flex justify-between items-center">

        <div className={`${showWarning ? "scale-y-100 opacity-95" : "scale-y-0 opacity-0"} h-60 absolute bottom-35 md:bottom-40 md:left-28 p-2 bg-comment flex drop-shadow-lg duration-300 origin-bottom`}>
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
            maxLength={200}
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
        {inputText.length === 200 ? (
          <p className="text-sm absolute bottom-0 left-[5%] text-neutral-400 italic">200 characters max allowed</p>
        ) : ""}
      </section>
    </div>
  )
}

export default TranslatorInput;

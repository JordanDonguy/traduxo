"use client";

import { Mic, CircleStop, SendHorizontal } from "lucide-react";
import { FormEvent, useRef, useState } from "react";
import { useSuggestion } from "@traduxo/packages/hooks/suggestion/useSuggestion";
import DicesButton from "../shared/DicesButton";
import CopyButton from "./CopyButton";
import TextToSpeechButton from "./TextToSpeechButton";
import { toast } from "react-toastify";

type TextInputFormProps = {
  inputText: string;
  setInputText: (text: string) => void;
  handleTranslate: (text: string) => void;
  isListening: boolean;
  handleVoice: () => void;
  inputLang: string;
};

export default function TextInputForm({
  inputText,
  setInputText,
  handleTranslate,
  isListening,
  handleVoice,
  inputLang
}: TextInputFormProps) {
  const [animateSend, setAnimateSend] = useState(false);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const { suggestTranslation, isRolling } = useSuggestion({});

  const handleSubmit = ((e: FormEvent<Element>) => {
    e.preventDefault();
    if (!inputText) return toast.info("Please enter something to translate… ✏️")
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
      typingTimeout.current = null; // mark it cleared
    }
    setAnimateSend(false); // make sure animation doesn't trigger
    handleTranslate(inputText);
  });

  // Auto resize input based on content length
  const autoResize = () => {
    const el = textareaRef.current;
    if (!el) return;

    el.style.height = "auto";                 // reset so shrink works
    el.style.height = `${el.scrollHeight}px`; // set height to content
  };

  return (
    <form
      id="text-input-form"
      aria-label="Text input form"
      data-testid="input-form"
      onSubmit={handleSubmit}
      className="col-span-1 max-h-[50vh] shadow-md flex flex-col justify-between pt-4 pb-2 md:px-6 border border-[var(--gray-1)] rounded-md font-semibold"
    >
      {/* -------- Text input -------- */}
      <textarea
        id="text-input"
        aria-label="Enter text to translate"
        ref={textareaRef}
        className="w-full text-2xl focus:outline-none resize-none px-2 pb-2"
        placeholder="Enter some text..."
        onChange={(e) => {
          setInputText(e.target.value);
          autoResize();
          // reset waiting + animation
          setAnimateSend(false);

          // clear old timer
          if (typingTimeout.current) clearTimeout(typingTimeout.current);

          if (e.target.value.length > 0) {
            // start new timer if there's some text in input
            typingTimeout.current = setTimeout(() => {
              setAnimateSend(true); // triggers bounce
            }, 2000);
          }
        }}
        value={inputText}
        autoComplete="off"
        maxLength={100}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            handleSubmit(e);
          }
        }}
      />

      <div className="flex justify-between items-center">

        {/* -------- Voice Input button -------- */}
        <div className="flex">
          <button
            id="voice-input-button"
            aria-label="Voice input"
            data-testid="mic-button"
            type="button"
            className={`w-10 h-10 text-[var(--gray-6)] hover-1 hover:text-[var(--text)] rounded-full 
            ${isListening ? "text-red-400" : "text-[var(--blue-1)]"} flex justify-center items-center`}
            onClick={handleVoice}
          >
            {!isListening ? <Mic /> : <CircleStop />}
          </button>

          {/* -------- Suggestion button -------- */}
          <DicesButton
            suggestTranslation={suggestTranslation}
            size={28}
            isRolling={isRolling}
            className="hidden md:inline text-[var(--blue-1)] hover:text-[var(--text)]"
          />

          {/* -------- Copy and TTS buttons -------- */}
          <CopyButton text={inputText} />
          <TextToSpeechButton text={inputText} lang={inputLang} />
        </div>

        {/* -------- Input length count -------- */}
        <div className="text-neutral-500">{inputText.length} / 100</div>

        {/* -------- Submit button -------- */}
        <button
          id="submit-translation-button"
          aria-label="Translate"
          type="submit"
          className={`w-10 h-10 text-[var(--blue-1)] hover-1 rounded-full flex justify-center items-center
            ${animateSend ? "ping-once" : ""}`}
        >
          <SendHorizontal />
        </button>
      </div>
    </form>
  );
}

"use client";

import { Mic, CircleStop, SendHorizontal } from "lucide-react";
import { FormEvent, useRef, useState } from "react";
import { useSuggestion } from "@traduxo/packages/hooks/suggestion/useSuggestion";
import DicesButton from "../shared/DicesButton";
import CopyButton from "./CopyButton";

type TextInputFormProps = {
  inputText: string;
  setInputText: (text: string) => void;
  handleTranslate: (e: React.FormEvent) => void;
  isListening: boolean;
  handleVoice: () => void;
};

export default function TextInputForm({
  inputText,
  setInputText,
  handleTranslate,
  isListening,
  handleVoice
}: TextInputFormProps) {
  const [animateSend, setAnimateSend] = useState(false);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  const { suggestTranslation, isRolling } = useSuggestion({});

  const handleSubmit = ((e: FormEvent<Element>) => {
    e.preventDefault()
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
      typingTimeout.current = null; // mark it cleared
    }
    setAnimateSend(false); // make sure animation doesn't trigger
    handleTranslate(e);
  });

  return (
    <form
      id="text-input-form"
      aria-label="Text input form"
      data-testid="input-form"
      onSubmit={handleSubmit}
      className="col-span-1 flex flex-col justify-between pt-4 pb-2 px-2 md:px-6 border border-zinc-500 rounded-md font-semibold shadow-sm"
    >
      <textarea
        id="text-input"
        aria-label="Enter text to translate"
        className="w-full flex-1 text-2xl focus:outline-none resize-none pl-2"
        placeholder="Enter some text..."
        onChange={(e) => {
          setInputText(e.target.value);

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

        <div className="flex">
          <button
            id="voice-input-button"
            aria-label="Voice input"
            data-testid="mic-button"
            type="button"
            className={`w-10 h-10 hover:cursor-pointer hover:bg-[var(--hover)] rounded-full 
            ${isListening && "text-red-400"} flex justify-center items-center`}
            onClick={handleVoice}
          >
            {!isListening ? <Mic /> : <CircleStop />}
          </button>

          <DicesButton
            suggestTranslation={suggestTranslation}
            size={28}
            isRolling={isRolling}
            className="hidden md:inline"
          />

          <CopyButton text={inputText} className="hover:bg-[var(--hover)] " />
        </div>

        <div className="text-neutral-500">{inputText.length} / 100</div>

        <button
          id="submit-translation-button"
          aria-label="Translate"
          type="submit"
          className={`w-10 h-10 hover:cursor-pointer hover:bg-[var(--hover)] rounded-full flex justify-center items-center
            ${animateSend ? "ping-once" : ""}`}
        >
          <SendHorizontal />
        </button>
      </div>
    </form>
  );
}

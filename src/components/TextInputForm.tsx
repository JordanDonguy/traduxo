"use client";

import { Mic, CircleStop } from "lucide-react";

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
  return (
    <section className="w-full h-1/2 flex items-center justify-center">
      <form
        data-testid="input-form"
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

        <button type="submit" className="sr-only">Translate</button>

        <button
          data-testid="mic-button"
          type="button"
          className="w-12 hover:cursor-pointer hover:bg-[var(--hover)] rounded-full flex justify-center items-center"
          onClick={handleVoice}
        >
          {!isListening ? <Mic /> : <CircleStop />}
        </button>
      </form>

      {inputText.length === 100 && (
        <p className="text-sm absolute bottom-1 left-[5%] text-neutral-400 italic">100 characters max allowed</p>
      )}
    </section>
  );
}

"use client";

import { useState } from "react";
import { Volume2 } from "lucide-react";
import { toast } from "react-toastify";

interface TextToSpeechButtonProps {
  text: string;
  lang: string;
  className?: string;
  size?: number;
}

const TextToSpeechButton = ({ text, lang, className = "", size = 24 }: TextToSpeechButtonProps) => {
  const [speaking, setSpeaking] = useState(false);

  const handleSpeak = () => {
    if (!text) return toast.info("Nothing to read! 🤔 Please enter some text.");
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    speechSynthesis.speak(utterance);
  };

  return (
    <button
      onClick={handleSpeak}
      className={`w-10 h-10 text-[var(--blue-1)] hover-1 hover:text-[var(--text)] rounded-full flex justify-center items-center ${className}`}
      aria-label="Read text aloud"
      type="button"
    >
      <Volume2 className={`${speaking ? "text-green-400" : ""}`} size={size} />
    </button>
  );
};

export default TextToSpeechButton;

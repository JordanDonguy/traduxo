"use client";

import { useState } from "react";
import { createSpeechRecognition } from "@/lib/client/utils/speechRecognition";

type UseVoiceInputProps = {
  inputLang: string;                          // Current input language
  setInputText: (text: string) => void;       // Function to update the input text
  inputText: string;                           // Current value of input field

  // ---- Injected dependencies for testing ----
  speechRecognizer?: typeof createSpeechRecognition;
  timeoutFn?: typeof setTimeout;
  alertFn?: typeof alert;
  consoleFn?: typeof console.log;
};


export function useVoiceInput({
  inputLang,
  setInputText,
  inputText,
  speechRecognizer = createSpeechRecognition,
  timeoutFn = setTimeout,
  alertFn = alert,
  consoleFn = console.log,
}: UseVoiceInputProps) {
  // ---- Step 1: Initialize state ----
  // isListening: whether speech recognition is currently active
  // showWarning: whether to display a warning when "auto" language is selected
  const [isListening, setIsListening] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  // ---- Step 2: Define the voice input handler ----
  const handleVoice = () => {
    // ---- Step 2a: Check for unsupported "auto" input language ----
    if (inputLang === "auto") {
      // Show warning to user for 4 seconds
      setShowWarning(true);
      timeoutFn(() => setShowWarning(false), 4000);
      return false;
    }

    // ---- Step 2b: Create a speech recognition instance ----
    const recognizer = speechRecognizer({
      lang: inputLang,                       // Set recognition language
      onResult: (text) => setInputText(text),// Update input text on recognition result
      onStop: () => setIsListening(false),   // Reset listening state when recognition stops
      onError: (err) => consoleFn("Speech error:", err), // Log errors
    });

    // ---- Step 2c: Handle unsupported browsers ----
    if (!recognizer) {
      alertFn(
        "Voice input isn't supported on this browser, please use Chrome or any other compatible browser."
      );
      return false;
    }

    // ---- Step 2d: Control recognition start / stop ----
    if (!isListening) {
      // Start listening
      recognizer.start();
      setIsListening(true);
      return true;
    } else if (!inputText) {
      // Abort if no input yet
      recognizer.abort();
      setIsListening(false);
      return true;
    } else {
      // Stop recognition if already listening
      recognizer.stop();
      setIsListening(false);
      return true;
    }
  };

  // ---- Step 3: Return state and handlers ----
  return { isListening, showWarning, setShowWarning, handleVoice };
}

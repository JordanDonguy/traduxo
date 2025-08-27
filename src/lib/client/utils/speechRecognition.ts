"use client"

export function createSpeechRecognition({
  lang = "en-US",
  onResult,
  onError,
  onStop,
  SpeechRecognitionClass,
}: {
  lang?: string;
  onResult: (transcript: string) => void;
  onError?: (error: string) => void;
  onStop?: () => void;
  SpeechRecognitionClass?: new () => SpeechRecognition & { abort: () => void }; // for test injection
}) {
  // Environment check
  if (typeof window === "undefined") {
    console.warn("SpeechRecognition not supported in this environment.");
    return null;
  }

  // Browser support check
  const effectiveClass =
    SpeechRecognitionClass ||
    (window.SpeechRecognition || window.webkitSpeechRecognition);

  if (!effectiveClass) {
    console.warn("SpeechRecognition not supported in this browser.");
    return null;
  }

  const recognition = new effectiveClass() as SpeechRecognition & { abort: () => void };
  recognition.lang = lang;
  recognition.continuous = false;
  recognition.interimResults = true;

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    const transcript = event.results[0][0].transcript;
    onResult(transcript);
  };

  recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
    if (onError) {
      onError(event.error);
    } else {
      console.error("Speech recognition error:", event.error);
    }
  };

  recognition.addEventListener("end", () => {
    if (onStop) onStop();
  });

  return {
    start: () => recognition.start(),
    stop: () => recognition.stop(),
    abort: () => recognition.abort(),
    _recognition: recognition, // for testing
  };
}

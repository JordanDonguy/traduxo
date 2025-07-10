// utils/speechRecognition.ts
export function createSpeechRecognition({
  lang = "en-US",
  onResult,
  onError,
  onStart,
  onEnd,
}: {
  lang?: string;
  onResult: (transcript: string) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
}) {
  const SpeechRecognition =
    typeof window !== "undefined" &&
    (window.SpeechRecognition || window.webkitSpeechRecognition);

  if (!SpeechRecognition) {
    console.warn("SpeechRecognition not supported in this browser.");
    return null;
  }

  const recognition: SpeechRecognition = new SpeechRecognition();
  recognition.lang = lang;
  recognition.continuous = false;
  recognition.interimResults = true;

  recognition.addEventListener("start", () => {
    if (onStart) onStart();
  });

  recognition.addEventListener("end", () => {
    if (onEnd) onEnd();
  });

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

  return {
    start: () => recognition.start(),
    stop: () => recognition.stop(),
  };
}

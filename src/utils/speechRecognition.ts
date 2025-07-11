// utils/speechRecognition.ts
export function createSpeechRecognition({
  lang = "en-US",
  onResult,
  onError,
}: {
  lang?: string;
  onResult: (transcript: string) => void;
  onError?: (error: string) => void;
}) {
  const SpeechRecognition =
    typeof window !== "undefined" &&
    (window.SpeechRecognition || window.webkitSpeechRecognition);

  if (!SpeechRecognition) {
    console.warn("SpeechRecognition not supported in this browser.");
    return null;
  }

  const recognition = new (window.SpeechRecognition || (window as any).webkitSpeechRecognition)() as SpeechRecognition & {
    abort: () => void;
  };

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

  return {
    start: () => recognition.start(),
    stop: () => recognition.stop(),
    abort: () => recognition.abort(),
  };
}

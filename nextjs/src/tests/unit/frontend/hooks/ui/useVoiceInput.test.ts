/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
import { useVoiceInput } from "@/lib/client/hooks/ui/useVoiceInput";
import { createSpeechRecognition } from "@/lib/client/utils/ui/speechRecognition";
import { toast } from "react-toastify";

// ---- Mocks ----
const mockRecognizer = {
  start: jest.fn(),
  stop: jest.fn(),
  abort: jest.fn(),
  onResult: undefined as ((text: string) => void) | undefined,
  onStop: undefined as (() => void) | undefined,
  onError: undefined as ((err: string) => void) | undefined,
  triggerResult(text: string) {
    this.onResult?.(text);
  },
  triggerStop() {
    this.onStop?.();
  },
  triggerError(err: string) {
    this.onError?.(err);
  },
};

const mockRecognizerFn = jest.fn(
  ({ onResult, onStop, onError }: { onResult: (text: string) => void; onStop?: () => void; onError?: (err: string) => void }) => {
    mockRecognizer.onResult = onResult;
    mockRecognizer.onStop = onStop;
    mockRecognizer.onError = onError;
    return mockRecognizer;
  }
);

// ---- Tests ----
describe("useVoiceInput", () => {
  let mockSetInputText: jest.Mock;
  let mockToast: typeof toast;
  let mockConsole: jest.Mock;

  beforeEach(() => {
    mockSetInputText = jest.fn();
    mockToast = { warn: jest.fn(), error: jest.fn(), info: jest.fn() } as unknown as typeof toast;
    mockConsole = jest.fn();
  });

  // ------ Test 1️⃣: toast warning when inputLang is 'auto' ------
  it("shows toast info if inputLang is 'auto'", () => {
    const { result } = renderHook(() =>
      useVoiceInput({
        inputLang: "auto",
        setInputText: mockSetInputText,
        inputText: "",
        toastFn: mockToast,
      })
    );

    act(() => {
      const returned = result.current.handleVoice();
      expect(returned).toBe(false);
    });

    expect(mockToast.info).toHaveBeenCalledWith(
      "Please select an input language to use voice input 🙏"
    );
  });

  // ------ Test 2️⃣: unsupported browser ------
  it("displays toast error if browser doesn't support voice input", () => {
    const unsupportedFn = jest.fn(() => null);

    const { result } = renderHook(() =>
      useVoiceInput({
        inputLang: "en",
        setInputText: mockSetInputText,
        inputText: "",
        speechRecognizer: unsupportedFn as unknown as typeof createSpeechRecognition,
        toastFn: mockToast,
      })
    );

    act(() => {
      const returned = result.current.handleVoice();
      expect(returned).toBe(false);
    });

    expect(mockToast.error).toHaveBeenCalledWith(
      "Voice input isn't supported on this browser, please use Chrome or any other compatible browser."
    );
  });

  // ------ Test 3️⃣: starts recognition ------
  it("starts recognition when not listening", () => {
    const { result } = renderHook(() =>
      useVoiceInput({
        inputLang: "en",
        setInputText: mockSetInputText,
        inputText: "",
        speechRecognizer: mockRecognizerFn as unknown as typeof createSpeechRecognition,
      })
    );

    act(() => {
      const returned = result.current.handleVoice();
      expect(returned).toBe(true);
    });

    expect(mockRecognizer.start).toHaveBeenCalled();
    expect(result.current.isListening).toBe(true);
  });

  // ------ Test 4️⃣: abort recognition when listening but no inputText ------
  it("aborts recognition when listening but no inputText", () => {
    const { result } = renderHook(() =>
      useVoiceInput({
        inputLang: "en",
        setInputText: mockSetInputText,
        inputText: "",
        speechRecognizer: mockRecognizerFn as unknown as typeof createSpeechRecognition,
      })
    );

    act(() => result.current.handleVoice()); // start listening
    act(() => {
      const returned = result.current.handleVoice(); // abort because inputText is empty
      expect(returned).toBe(true);
    });

    expect(mockRecognizer.abort).toHaveBeenCalled();
    expect(result.current.isListening).toBe(false);
  });

  // ------ Test 5️⃣: stop recognition when listening and inputText exists ------
  it("stops recognition when listening and inputText exists", () => {
    const { result } = renderHook(() =>
      useVoiceInput({
        inputLang: "en",
        setInputText: mockSetInputText,
        inputText: "hello",
        speechRecognizer: mockRecognizerFn as unknown as typeof createSpeechRecognition,
      })
    );

    act(() => result.current.handleVoice()); // start listening
    act(() => {
      const returned = result.current.handleVoice(); // stop because inputText exists
      expect(returned).toBe(true);
    });

    expect(mockRecognizer.stop).toHaveBeenCalled();
    expect(result.current.isListening).toBe(false);
  });

  // ------ Test 6️⃣: setInputText on recognition result ------
  it("calls setInputText when onResult is triggered", () => {
    const { result } = renderHook(() =>
      useVoiceInput({
        inputLang: "en",
        setInputText: mockSetInputText,
        inputText: "",
        speechRecognizer: mockRecognizerFn as unknown as typeof createSpeechRecognition,
      })
    );

    act(() => result.current.handleVoice());
    act(() => mockRecognizer.triggerResult("Hello world"));

    expect(mockSetInputText).toHaveBeenCalledWith("Hello world");
  });

  // ------ Test 7️⃣: isListening false when recognition stops ------
  it("sets isListening to false when onStop is triggered", () => {
    const { result } = renderHook(() =>
      useVoiceInput({
        inputLang: "en",
        setInputText: mockSetInputText,
        inputText: "",
        speechRecognizer: mockRecognizerFn as unknown as typeof createSpeechRecognition,
      })
    );

    act(() => result.current.handleVoice());
    act(() => mockRecognizer.triggerStop());

    expect(result.current.isListening).toBe(false);
  });

  // ------ Test 8️⃣: logs error on recognition error ------
  it("calls consoleFn when onError is triggered", () => {
    const { result } = renderHook(() =>
      useVoiceInput({
        inputLang: "en",
        setInputText: mockSetInputText,
        inputText: "",
        speechRecognizer: mockRecognizerFn as unknown as typeof createSpeechRecognition,
        consoleFn: mockConsole,
      })
    );

    act(() => result.current.handleVoice());
    act(() => mockRecognizer.triggerError("Test error"));

    expect(mockConsole).toHaveBeenCalledWith("Speech error:", "Test error");
  });
});

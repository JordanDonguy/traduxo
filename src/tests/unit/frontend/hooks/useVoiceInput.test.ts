/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
import { useVoiceInput } from "@/lib/client/hooks/useVoiceInput";
import { createSpeechRecognition } from "@/lib/client/utils/speechRecognition";
import { toast } from "react-toastify";

// ---- Mocks ----

// This single instance is used across tests to control recognition behavior.
// It includes helper methods to manually trigger the internal callbacks
// (`onResult`, `onStop`, `onError`) for full function coverage.
const mockRecognizer = {
  start: jest.fn(),
  stop: jest.fn(),
  abort: jest.fn(),
  _recognition: { abort: jest.fn() } as unknown as SpeechRecognition & { abort: () => void },
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

// Mock factory function
// When `speechRecognizer` is called inside the hook, we return the same
// mock instance and register the callbacks.
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

  beforeAll(() => {
    // Use fake timers so we can fast-forward the warning timeout
    jest.useFakeTimers();
  });
  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    mockSetInputText = jest.fn();
    mockToast = { error: jest.fn() } as unknown as typeof toast;
    mockConsole = jest.fn();
  });

  // ------ Test 1️⃣ ------
  it("shows warning if inputLang is 'auto' and hides after timeout", () => {
    const { result } = renderHook(() =>
      useVoiceInput({
        inputLang: "auto",
        setInputText: mockSetInputText,
        inputText: "",
        timeoutFn: setTimeout,
      })
    );

    // Trigger handleVoice → should return false
    act(() => {
      const returned = result.current.handleVoice();
      expect(returned).toBe(false);
    });

    // Warning should appear immediately
    expect(result.current.showWarning).toBe(true);

    // Fast-forward the 4s timeout
    act(() => jest.advanceTimersByTime(4000));
    expect(result.current.showWarning).toBe(false);
  });

  // ------ Test 2️⃣ ------
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

  // ------ Test 3️⃣ ------
  it("starts recognition when not listening", () => {
    const { result } = renderHook(() =>
      useVoiceInput({
        inputLang: "en",
        setInputText: mockSetInputText,
        inputText: "",
        speechRecognizer: mockRecognizerFn as unknown as typeof createSpeechRecognition,
      })
    );

    // Start listening
    act(() => {
      const returned = result.current.handleVoice();
      expect(returned).toBe(true);
    });

    expect(mockRecognizer.start).toHaveBeenCalled();
    expect(result.current.isListening).toBe(true);
  });

  // ------ Test 4️⃣ ------
  it("aborts recognition when listening but no inputText", () => {
    const { result } = renderHook(() =>
      useVoiceInput({
        inputLang: "en",
        setInputText: mockSetInputText,
        inputText: "",
        speechRecognizer: mockRecognizerFn as unknown as typeof createSpeechRecognition,
      })
    );

    // Step 1: Start listening
    act(() => result.current.handleVoice());

    // Step 2: Call handleVoice again with empty input → abort
    act(() => {
      const returned = result.current.handleVoice();
      expect(returned).toBe(true);
    });

    expect(mockRecognizer.abort).toHaveBeenCalled();
    expect(result.current.isListening).toBe(false);
  });

  // ------ Test 5️⃣ ------
  it("stops recognition when listening and inputText exists", () => {
    const { result } = renderHook(() =>
      useVoiceInput({
        inputLang: "en",
        setInputText: mockSetInputText,
        inputText: "hello",
        speechRecognizer: mockRecognizerFn as unknown as typeof createSpeechRecognition,
      })
    );

    // Step 1: Start listening
    act(() => result.current.handleVoice());

    // Step 2: Call handleVoice again with inputText → stop
    act(() => {
      const returned = result.current.handleVoice();
      expect(returned).toBe(true);
    });

    expect(mockRecognizer.stop).toHaveBeenCalled();
    expect(result.current.isListening).toBe(false);
  });

  // ------ Test 6️⃣ ------
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

  // ------ Test 7️⃣ ------
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

  // ------ Test 8️⃣ ------
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

    // ---- Step 1: Trigger voice input handler ----
    act(() => result.current.handleVoice());

    // ---- Step 2: Simulate an error from the recognizer ----
    act(() => mockRecognizer.triggerError("Test error"));

    // ---- Step 3: Assert that consoleFn was called correctly ----
    expect(mockConsole).toHaveBeenCalledWith("Speech error:", "Test error");
  });
});

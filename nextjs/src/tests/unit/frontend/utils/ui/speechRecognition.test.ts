/**
 * @jest-environment jsdom
 */
import { createSpeechRecognition } from "@/lib/client/utils/ui/speechRecognition";

describe("createSpeechRecognition", () => {
  let onResult: jest.Mock;
  let onError: jest.Mock;
  let onStop: jest.Mock;

  // ------ Mock Class for SpeechRecognition ------
  class MockSpeechRecognition implements Partial<SpeechRecognition> {
    lang = "";
    continuous = false;
    interimResults = false;
    onresult?: (event: SpeechRecognitionEvent) => void;
    onerror?: (event: SpeechRecognitionErrorEvent) => void;
    start = jest.fn();
    stop = jest.fn();
    abort = jest.fn();
    addEventListener = jest.fn((event: string, cb: () => void) => {
      if (event === "end") this._endCallback = cb;
    });
    _endCallback?: () => void;
  }

  type MockRecognition = MockSpeechRecognition & { abort: () => void };

  let originalWarn: typeof console.warn;

  beforeEach(() => {
    onResult = jest.fn();
    onError = jest.fn();
    onStop = jest.fn();

    // Suppress console.warn during tests
    originalWarn = console.warn;
    console.warn = jest.fn();
  });

  afterAll(() => {
    console.warn = originalWarn;
  });

  // ------ Test 1️⃣ ------
  it("returns null if SpeechRecognition is unavailable", () => {
    delete window.SpeechRecognition;
    delete window.webkitSpeechRecognition;

    const rec = createSpeechRecognition({ onResult });
    expect(rec).toBeNull();
  });

  // ------ Test 2️⃣ ------
  it("creates recognition instance and calls methods", () => {
    const recognition = createSpeechRecognition({
      onResult,
      onError,
      onStop,
      SpeechRecognitionClass: MockSpeechRecognition as unknown as new () => SpeechRecognition & { abort: () => void },
    });

    expect(recognition).toBeDefined();
    recognition?.start();
    recognition?.stop();
    recognition?.abort();

    const recInstance = recognition!._recognition as unknown as MockRecognition;
    expect(recInstance.start).toHaveBeenCalledTimes(1);
    expect(recInstance.stop).toHaveBeenCalledTimes(1);
    expect(recInstance.abort).toHaveBeenCalledTimes(1);
  });

  // ------ Test 3️⃣ ------
  it("triggers onResult callback", () => {
    const recognition = createSpeechRecognition({
      onResult,
      SpeechRecognitionClass: MockSpeechRecognition as unknown as new () => SpeechRecognition & { abort: () => void },
    });

    const recInstance = recognition!._recognition as unknown as MockRecognition;
    const mockEvent = { results: [[{ transcript: "hello" }]] } as unknown as SpeechRecognitionEvent;

    // Manually call onresult
    recInstance.onresult?.(mockEvent);
    expect(onResult).toHaveBeenCalledWith("hello");
  });

  // ------ Test 4️⃣ ------
  it("triggers onError callback", () => {
    const recognition = createSpeechRecognition({
      onResult,
      onError,
      SpeechRecognitionClass: MockSpeechRecognition as unknown as new () => SpeechRecognition & { abort: () => void },
    });

    const recInstance = recognition!._recognition as unknown as MockRecognition;
    const mockErrorEvent = { error: "network" } as unknown as SpeechRecognitionErrorEvent;

    // Manually call onerror
    recInstance.onerror?.(mockErrorEvent);
    expect(onError).toHaveBeenCalledWith("network");
  });

  // ------ Test 5️⃣ ------
  it("triggers onStop callback", () => {
    const recognition = createSpeechRecognition({
      onResult,
      onStop,
      SpeechRecognitionClass: MockSpeechRecognition as unknown as new () => SpeechRecognition & { abort: () => void },
    });

    const recInstance = recognition!._recognition as unknown as MockRecognition;

    // Assign _endCallback to simulate "end" event
    recInstance._endCallback = onStop;

    // Trigger the "end" event
    recInstance._endCallback?.();

    expect(onStop).toHaveBeenCalled();
  });

  // ------ Test 6️⃣ ------
  it("logs to console.error if onError is not provided", () => {
    const spyError = jest.spyOn(console, "error").mockImplementation(() => { });

    const recognition = createSpeechRecognition({
      onResult,
      SpeechRecognitionClass: MockSpeechRecognition as unknown as new () => SpeechRecognition & { abort: () => void },
    });

    const recInstance = recognition!._recognition as unknown as MockRecognition;
    const mockErrorEvent = { error: "network-fail" } as unknown as SpeechRecognitionErrorEvent;

    recInstance.onerror?.(mockErrorEvent);

    expect(spyError).toHaveBeenCalledWith("Speech recognition error:", "network-fail");

    spyError.mockRestore();
  });
});

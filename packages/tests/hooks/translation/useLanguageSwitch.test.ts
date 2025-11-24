/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
import { useLanguageSwitch } from "@traduxo/packages/hooks/translation/useLanguageSwitch";

describe("useLanguageSwitch", () => {
  // ---- Use fake timers to simulate the 80ms animation timeout ----
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  // ---- Mock functions for updating input/output languages ----
  let mockSetInputLang: jest.Mock;
  let mockSetOutputLang: jest.Mock;

  beforeEach(() => {
    mockSetInputLang = jest.fn();
    mockSetOutputLang = jest.fn();
  });

  // ------ Test 1️⃣ ------
  it("initial state isSwitching should be false", () => {
    const { result } = renderHook(() =>
      useLanguageSwitch({
        inputLang: "en",
        outputLang: "fr",
        setInputLang: mockSetInputLang,
        setOutputLang: mockSetOutputLang,
        detectedLang: "es",
        inputTextLang: "",
        translatedTextLang: "",
      })
    );

    // Initially, the switching animation has not started
    expect(result.current.isSwitching).toBe(false);
  });

  // ------ Test 2️⃣ ------
  it("switches languages correctly when inputLang is not 'auto'", () => {
    const { result } = renderHook(() =>
      useLanguageSwitch({
        inputLang: "en",
        outputLang: "fr",
        setInputLang: mockSetInputLang,
        setOutputLang: mockSetOutputLang,
        detectedLang: "es",
        inputTextLang: "",
        translatedTextLang: "",
      })
    );

    // Trigger language switch
    act(() => result.current.switchLanguage());

    // Output should become previous input, input should become previous output
    expect(mockSetOutputLang).toHaveBeenCalledWith("en");
    expect(mockSetInputLang).toHaveBeenCalledWith("fr");

    // Switching animation should be active
    expect(result.current.isSwitching).toBe(true);
  });

  // ------ Test 3️⃣ ------
  it("uses detectedLang when inputLang is 'auto'", () => {
    const { result } = renderHook(() =>
      useLanguageSwitch({
        inputLang: "auto",
        outputLang: "fr",
        setInputLang: mockSetInputLang,
        setOutputLang: mockSetOutputLang,
        detectedLang: "es",
        inputTextLang: "",
        translatedTextLang: "",
      })
    );

    // Trigger language switch with 'auto' inputLang
    act(() => result.current.switchLanguage());

    // Output should use detectedLang instead of previous inputLang
    expect(mockSetOutputLang).toHaveBeenCalledWith("es");

    // Output/input swap still occurs for the animation
    expect(mockSetInputLang).toHaveBeenCalledWith("fr");

    // Switching animation active
    expect(result.current.isSwitching).toBe(true);
  });

  // ------ Test 4️⃣ ------
  it("resets isSwitching after 400ms", () => {
    const { result } = renderHook(() =>
      useLanguageSwitch({
        inputLang: "en",
        outputLang: "fr",
        setInputLang: mockSetInputLang,
        setOutputLang: mockSetOutputLang,
        detectedLang: "es",
        inputTextLang: "",
        translatedTextLang: "",
      })
    );

    act(() => result.current.switchLanguage());

    // Switching starts immediately
    expect(result.current.isSwitching).toBe(true);

    // Fast-forward 80ms to simulate animation end
    act(() => {
      jest.advanceTimersByTime(400);
    });

    // Switching should be reset
    expect(result.current.isSwitching).toBe(false);
  });

  // ------ Test 5️⃣ ------
  it("swaps input/output based on inputTextLang and translatedTextLang when provided", () => {
    const { result } = renderHook(() =>
      useLanguageSwitch({
        inputLang: "en",
        outputLang: "fr",
        setInputLang: mockSetInputLang,
        setOutputLang: mockSetOutputLang,
        detectedLang: "es",
        inputTextLang: "fr",
        translatedTextLang: "en",
      })
    );

    act(() => result.current.switchLanguage());

    // Hook detects that languages are already swapped, so it reverts
    expect(mockSetInputLang).toHaveBeenCalledWith("fr");
    expect(mockSetOutputLang).toHaveBeenCalledWith("en");
  });

  // ------ Test 6️⃣ ------
  it("falls back to 'en' when detectedLang equals outputLang and outputLang is not 'en'", () => {
    const { result } = renderHook(() =>
      useLanguageSwitch({
        inputLang: "auto",
        outputLang: "fr",
        setInputLang: mockSetInputLang,
        setOutputLang: mockSetOutputLang,
        detectedLang: "fr", // same as outputLang
        inputTextLang: "",
        translatedTextLang: "",
      })
    );

    act(() => result.current.switchLanguage());

    expect(mockSetOutputLang).toHaveBeenCalledWith("en");
    expect(mockSetInputLang).toHaveBeenCalledWith("fr");
  });
});

/**
 * @jest-environment jsdom
 */

import { translationHelper } from "@/lib/client/utils/translation/translate";
import { TextEncoder, TextDecoder } from "util";
import { TextEncoder as NodeTextEncoder, TextDecoder as NodeTextDecoder } from "util";

(globalThis as unknown as { TextEncoder: typeof TextEncoder }).TextEncoder = NodeTextEncoder;
(globalThis as unknown as { TextDecoder: typeof TextDecoder }).TextDecoder = NodeTextDecoder;

describe("translationHelper", () => {
  // ---- Separate mocks for each setter ----
  const setInputText = jest.fn();
  const setInputTextLang = jest.fn();
  const setTranslatedTextLang = jest.fn();
  const setTranslatedText = jest.fn();
  const setSaveToHistory = jest.fn();
  const setExplanation = jest.fn();
  const setIsLoading = jest.fn();
  const setIsFavorite = jest.fn();
  const setTranslationId = jest.fn();
  const setError = jest.fn();

  const defaultArgs = {
    inputText: "Hello",
    inputLang: "en",
    outputLang: "fr",
    setInputText,
    setInputTextLang,
    setSaveToHistory,
    setTranslatedTextLang,
    setTranslatedText,
    setExplanation,
    setIsLoading,
    setIsFavorite,
    setTranslationId,
    setError,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ------ Test 1️⃣ ------
  it("returns early if inputText is empty", async () => {
    const res = await translationHelper({ ...defaultArgs, inputText: "", fetcher: jest.fn() });
    expect(res).toEqual({ success: false, message: "No input text" });
    expect(setInputText).not.toHaveBeenCalled();
  });

  // ------ Test 2️⃣ ------
  it("sets state correctly on successful translation (mocked streaming fetcher)", async () => {
    // Simulate a ReadableStream from a string chunk
    const encoder = new TextEncoder();
    const chunks = [
      JSON.stringify({ type: "main_translation", value: "Bonjour" }) + "\n"
    ];
    let callIndex = 0;

    const fakeFetcher = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: {
        getReader: () => ({
          read: jest.fn().mockImplementation(async () => {
            if (callIndex < chunks.length) {
              const value = encoder.encode(chunks[callIndex]);
              callIndex++;
              return { done: false, value };
            }
            return { done: true, value: undefined };
          }),
        }),
      },
      json: jest.fn().mockResolvedValue({}),
    });

    const res = await translationHelper({ ...defaultArgs, fetcher: fakeFetcher });

    expect(res.success).toBe(true);
    expect(setTranslatedText).toHaveBeenCalled();
    const lastCall = setTranslatedText.mock.calls[setTranslatedText.mock.calls.length - 1][0];
    expect(typeof lastCall).toBe("function");

    // Execute the updater with an empty array to simulate state
    expect(setSaveToHistory).toHaveBeenCalledWith(true);
    const result = lastCall([]);
    expect(result).toEqual([{ type: "main_translation", value: "Bonjour" }]);
  });


  // ------ Test 3️⃣ ------
  it("handles 429 response with error message", async () => {
    const fakeFetcher = jest.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: jest.fn().mockResolvedValue({ error: "Rate limit exceeded" }),
    });

    const res = await translationHelper({ ...defaultArgs, fetcher: fakeFetcher });

    expect(res).toEqual({ success: false, error: "Rate limit exceeded" });
    expect(setError).toHaveBeenCalledWith("Rate limit exceeded");
  });

  // ------ Test 4️⃣ ------
  it("handles generic non-429 fetch response error", async () => {
    const fakeFetcher = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: jest.fn().mockResolvedValue({ error: "Server crashed" }),
    });

    const res = await translationHelper({ ...defaultArgs, fetcher: fakeFetcher });

    expect(res.success).toBe(false);
    expect(res.error).toContain("Oops! Something went wrong");
    expect(setError).toHaveBeenCalledWith(
      expect.stringContaining("Oops! Something went wrong")
    );
  });

  // ------ Test 5️⃣ ------
  it("blurs active element if present", async () => {
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();
    const blurSpy = jest.spyOn(input, "blur");

    await translationHelper({
      ...defaultArgs,
      fetcher: jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        body: { getReader: () => ({ read: jest.fn().mockResolvedValue({ done: true }) }) },
        json: jest.fn(),
      }),
    });

    expect(blurSpy).toHaveBeenCalled();
    document.body.removeChild(input);
  });

  // ------ Test 6️⃣ ------
  it("sets inputTextLang immediately if inputLang is not 'auto'", async () => {
    const fakeFetcher = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: { getReader: () => ({ read: jest.fn().mockResolvedValue({ done: true }) }) },
      json: jest.fn(),
    });

    await translationHelper({ ...defaultArgs, inputLang: "en", fetcher: fakeFetcher });

    expect(setInputTextLang).toHaveBeenCalledWith("en");
  });

  // ------ Test 7️⃣ ------
  it("sets fallback inputTextLang to 'XX' if inputLang is 'auto' and Gemini returns no orig_lang_code", async () => {
    const fakeFetcher = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: { getReader: () => ({ read: jest.fn().mockResolvedValue({ done: true }) }) },
      json: jest.fn(),
    });

    await translationHelper({ ...defaultArgs, inputLang: "auto", fetcher: fakeFetcher });

    expect(setInputTextLang).toHaveBeenCalledWith(expect.any(Function));

    // Execute the updater function to verify fallback
    const updater = setInputTextLang.mock.calls[setInputTextLang.mock.calls.length - 1][0];
    expect(updater(undefined)).toBe("XX"); // fallback works
  });

  // ------ Test 8️⃣ ------
  it("sets inputTextLang to Gemini's orig_lang_code if inputLang is 'auto'", async () => {
    const encoder = new TextEncoder();
    const chunk = JSON.stringify({ type: "orig_lang_code", value: "de" }) + "\n";

    let callIndex = 0;
    const fakeFetcher = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: {
        getReader: () => ({
          read: jest.fn().mockImplementation(async () => {
            if (callIndex < 1) {
              callIndex++;
              return { done: false, value: encoder.encode(chunk) };
            }
            return { done: true, value: undefined };
          }),
        }),
      },
      json: jest.fn(),
    });

    await translationHelper({ ...defaultArgs, inputLang: "auto", fetcher: fakeFetcher });

    // Ensure the updater function was called with Gemini's orig_lang_code
    expect(setInputTextLang).toHaveBeenCalledWith("de");

    // The fallback ("XX") should never overwrite
    const lastCall = setInputTextLang.mock.calls[setInputTextLang.mock.calls.length - 1][0];
    if (typeof lastCall === "function") {
      expect(lastCall(undefined)).not.toBe("XX");
    }
  });
});

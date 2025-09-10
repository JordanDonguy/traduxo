/**
 * @jest-environment jsdom
 */

import { translationHelper } from "@traduxo/packages/utils/translation/translate";
import { TextEncoder, TextDecoder } from "util";
import { blurActiveInput } from "@traduxo/packages/utils/ui/blurActiveInput";

(globalThis as any).TextEncoder = TextEncoder;
(globalThis as any).TextDecoder = TextDecoder;

jest.mock("@traduxo/packages/utils/ui/blurActiveInput");

describe("translationHelper", () => {
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
    setTranslatedTextLang,
    setTranslatedText,
    setSaveToHistory,
    setExplanation,
    setIsLoading,
    setIsFavorite,
    setTranslationId,
    setError,
  };

  beforeEach(() => jest.clearAllMocks());

  // ------ Test 1️⃣ ------
  it("returns early if inputText is empty", async () => {
    const res = await translationHelper({ ...defaultArgs, inputText: "", fetcher: jest.fn() });
    expect(res).toEqual({ success: false, error: "No input text" });
    expect(setInputText).not.toHaveBeenCalled();
  });

  // ------ Test 2️⃣ ------
  it("calls blurActiveInput", async () => {
    const fakeFetcher = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: { getReader: () => ({ read: jest.fn().mockResolvedValue({ done: true }) }) },
      json: jest.fn(),
    });

    await translationHelper({ ...defaultArgs, fetcher: fakeFetcher });

    expect(blurActiveInput).toHaveBeenCalled();
  });

  // ------ Test 3️⃣ ------
  it("handles a simple streamed translation chunk", async () => {
    const encoder = new TextEncoder();
    const chunk = JSON.stringify({ type: "main_translation", value: "Bonjour" }) + "\n";
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

    await translationHelper({ ...defaultArgs, fetcher: fakeFetcher });

    expect(setTranslatedText).toHaveBeenCalled();
    expect(setSaveToHistory).toHaveBeenCalledWith(true);
  });

  // ------ Test 4️⃣ ------
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

  // ------ Test 5️⃣ ------
  it("handles generic non-429 fetch response error", async () => {
    const fakeFetcher = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: jest.fn().mockResolvedValue({ error: "Server crashed" }),
    });

    const res = await translationHelper({ ...defaultArgs, fetcher: fakeFetcher });

    expect(res.success).toBe(false);
    expect(res.error).toContain("Oops! Something went wrong");
    expect(setError).toHaveBeenCalledWith(expect.stringContaining("Oops! Something went wrong"));
  });

  // ------ Test 6️⃣ ------
  it("falls back to 'XX' if inputLang is auto and no orig_lang_code returned", async () => {
    const fakeFetcher = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: { getReader: () => ({ read: jest.fn().mockResolvedValue({ done: true }) }) },
      json: jest.fn(),
    });

    await translationHelper({ ...defaultArgs, inputLang: "auto", fetcher: fakeFetcher });

    const updater = setInputTextLang.mock.calls[setInputTextLang.mock.calls.length - 1][0];
    expect(updater(undefined)).toBe("XX");
  });

  // ------ Test 7️⃣ ------
  it("sets inputTextLang to Gemini's orig_lang_code if provided", async () => {
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

    expect(setInputTextLang).toHaveBeenCalledWith("de");

    const lastCall = setInputTextLang.mock.calls[setInputTextLang.mock.calls.length - 1][0];
    if (typeof lastCall === "function") {
      expect(lastCall(undefined)).not.toBe("XX");
    }
  });

  // ------ Test 8️⃣ ------
  it("covers empty lines, non-string values, and prev state in setTranslatedText", async () => {
    const encoder = new TextEncoder();
    const chunks = [
      "\n", // empty line -> triggers !part.trim() continue
      JSON.stringify({ type: "main_translation", value: 123 }) + "\n", // non-string value
      JSON.stringify({ type: "main_translation", value: "Bonjour" }) + "\n", // normal string
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
      json: jest.fn(),
    });

    await translationHelper({ ...defaultArgs, fetcher: fakeFetcher });

    // Check that setTranslatedText was called
    expect(setTranslatedText).toHaveBeenCalled();

    // Execute the last updater with a previous array to cover the prev spread
    const lastUpdater = setTranslatedText.mock.calls[setTranslatedText.mock.calls.length - 1][0];
    const result = lastUpdater([{ type: "main_translation", value: "Existing" }]);

    expect(result).toEqual([
      { type: "main_translation", value: "Existing" },      // prev array
      { type: "main_translation", value: "Bonjour" },       // cleaned string
    ]);
  });

  // ------ Test 9️⃣ ------
  it("uses the default fetch if no fetcher is provided", async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: {
        getReader: () => ({
          read: jest.fn().mockResolvedValueOnce({ done: true }),
        }),
      },
    });

    await translationHelper({ ...defaultArgs });

    expect(globalThis.fetch).toHaveBeenCalled();
  });
});

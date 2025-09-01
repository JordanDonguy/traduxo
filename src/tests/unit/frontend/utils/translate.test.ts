/**
 * @jest-environment jsdom
 */

import { translationHelper } from "@/lib/client/utils/translate";

describe("translationHelper", () => {
  const mockSet = jest.fn();

  const defaultArgs = {
    inputText: "Hello",
    inputLang: "en",
    outputLang: "fr",
    setInputText: mockSet,
    setInputTextLang: mockSet,
    setTranslatedTextLang: mockSet,
    setTranslatedText: mockSet,
    setExplanation: mockSet,
    setIsLoading: mockSet,
    setIsFavorite: mockSet,
    setTranslationId: mockSet,
    setError: mockSet,
  };

  // ------ Test 1️⃣ ------
  it("returns early if inputText is empty", async () => {
    const res = await translationHelper({ ...defaultArgs, inputText: "", fetcher: jest.fn() });
    expect(res).toEqual({ success: false, message: "No input text" });
    expect(mockSet).not.toHaveBeenCalled();
  });

  // ------ Test 2️⃣ ------
  it("sets state correctly on successful translation", async () => {
    const fakeFetcher = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ text: "ignored" }),
    });

    // Mock cleaner to return TranslationItem[]
    const fakeResponseCleaner = jest.fn(() => [
      { type: "main_translation", value: "Bonjour" },
    ]);

    const res = await translationHelper({
      ...defaultArgs,
      fetcher: fakeFetcher,
      responseCleaner: fakeResponseCleaner,
    });

    expect(res).toEqual({
      success: true,
      data: [{ type: "main_translation", value: "Bonjour" }],
    });
    expect(defaultArgs.setTranslatedText).toHaveBeenCalledWith([
      { type: "main_translation", value: "Bonjour" },
    ]);
  });

  // ------ Test 3️⃣ ------
  it("handles 429 response with error message", async () => {
    const fakeFetcher = jest.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: jest.fn().mockResolvedValue({ error: "Rate limit exceeded" }),
    });

    const res = await translationHelper({
      ...defaultArgs,
      fetcher: fakeFetcher,
    });

    expect(res).toEqual({ success: false, error: "Rate limit exceeded" });
    expect(defaultArgs.setError).toHaveBeenCalledWith("Rate limit exceeded");
  });

  // ------ Test 4️⃣ ------
  it("handles generic non-429 fetch response error", async () => {
    const fakeFetcher = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: jest.fn().mockResolvedValue({ error: "Server crashed" }),
    });

    const res = await translationHelper({
      ...defaultArgs,
      fetcher: fakeFetcher,
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain("Oops! Something went wrong");
    expect(defaultArgs.setError).toHaveBeenCalledWith(
      expect.stringContaining("Oops! Something went wrong")
    );
  });

  // ------ Test 5️⃣ ------
  it("blurs active element if present", async () => {
    // Create a mock input and add it to the document
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    // Spy on the blur method
    const blurSpy = jest.spyOn(input, "blur");

    await translationHelper({
      ...defaultArgs,
      fetcher: jest.fn(),
    });

    // Verify that blur was called
    expect(blurSpy).toHaveBeenCalled();

    // Cleanup
    document.body.removeChild(input);
  });

  // ------ Test 6️⃣ ------
  it("sets inputTextLang from last element if inputLang is auto", async () => {
    const setTranslatedText = jest.fn();
    const setInputTextLang = jest.fn();
    const setTranslatedTextLang = jest.fn();
    const setIsLoading = jest.fn();
    const setError = jest.fn();

    const fakeFetcher = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ text: "ignored" }),
    });

    const fakeResponseCleaner = jest.fn(() => [
      { type: "main_translation", value: "Bonjour" },
      { type: "orig_lang_code", value: "fr" },
    ]);

    const res = await translationHelper({
      inputText: "Hello",
      inputLang: "auto",
      outputLang: "fr",
      setInputText: jest.fn(),
      setInputTextLang,
      setTranslatedTextLang,
      setTranslatedText,
      setExplanation: jest.fn(),
      setIsLoading,
      setIsFavorite: jest.fn(),
      setTranslationId: jest.fn(),
      setError,
      fetcher: fakeFetcher,
      responseCleaner: fakeResponseCleaner, // ✅ this is crucial
    });

    expect(setInputTextLang).toHaveBeenCalledWith("fr");
    expect(setTranslatedText).toHaveBeenCalledWith([
      { type: "main_translation", value: "Bonjour" },
      { type: "orig_lang_code", value: "fr" },
    ]);
    expect(res).toEqual({
      success: true,
      data: [
        { type: "main_translation", value: "Bonjour" },
        { type: "orig_lang_code", value: "fr" },
      ],
    });
  });
});

/**
 * @jest-environment jsdom
 */
import { suggestExpressionHelper } from "@/lib/client/utils/suggestExpression";
import { TextEncoder, TextDecoder } from "util";
import { TranslationItem } from "../../../../../types/translation";

(globalThis as unknown as { TextEncoder: typeof TextEncoder }).TextEncoder = TextEncoder;
(globalThis as unknown as { TextDecoder: typeof TextDecoder }).TextDecoder = TextDecoder;


describe("suggestExpressionHelper", () => {
  let fetchMock: jest.Mock;
  let setters: Record<string, jest.Mock>;

  beforeEach(() => {
    // ---- Mock fetch and setters ----
    fetchMock = jest.fn();
    setters = {
      setTranslatedText: jest.fn(),
      setInputTextLang: jest.fn(),
      setSaveToHistory: jest.fn(),
      setTranslatedTextLang: jest.fn(),
      setExplanation: jest.fn(),
      setIsLoading: jest.fn(),
      setIsFavorite: jest.fn(),
      setTranslationId: jest.fn(),
      setError: jest.fn(),
    };
  });

  // ------ Test 1️⃣ ------
  it("resets state correctly", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ text: '["hello"]' }) });

    await suggestExpressionHelper({
      detectedLang: "en",
      outputLang: "fr",
      fetcher: fetchMock,
      setTranslatedText: setters.setTranslatedText,
      setInputTextLang: setters.setInputTextLang,
      setSaveToHistory: setters.setSaveToHistory,
      setTranslatedTextLang: setters.setTranslatedTextLang,
      setExplanation: setters.setExplanation,
      setIsLoading: setters.setIsLoading,
      setIsFavorite: setters.setIsFavorite,
      setTranslationId: setters.setTranslationId,
      setError: setters.setError,
    });

    // ---- Check all state resets ----
    expect(setters.setIsLoading).toHaveBeenCalledWith(true);
    expect(setters.setError).toHaveBeenCalledWith("");
    expect(setters.setTranslatedText).toHaveBeenCalledWith([]);
    expect(setters.setExplanation).toHaveBeenCalledWith("");
    expect(setters.setIsFavorite).toHaveBeenCalledWith(false);
    expect(setters.setTranslationId).toHaveBeenCalledWith(undefined);
    expect(setters.setInputTextLang).toHaveBeenCalledWith("en");
    expect(setters.setTranslatedTextLang).toHaveBeenCalledWith("fr");
  });

  // ------ Test 2️⃣ ------
  it("handles success response", async () => {
    const fakeFetcher = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: {
        getReader: () => ({
          read: jest
            .fn()
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode(
                JSON.stringify({ type: "expression", value: "bonjour" }) + "\n"
              ),
            })
            .mockResolvedValueOnce({ done: true, value: undefined }),
        }),
      },
    });

    const result = await suggestExpressionHelper({
      detectedLang: "en",
      outputLang: "fr",
      fetcher: fakeFetcher,
      setTranslatedText: setters.setTranslatedText,
      setInputTextLang: setters.setInputTextLang,
      setSaveToHistory: setters.setSaveToHistory,
      setTranslatedTextLang: setters.setTranslatedTextLang,
      setExplanation: setters.setExplanation,
      setIsLoading: setters.setIsLoading,
      setIsFavorite: setters.setIsFavorite,
      setTranslationId: setters.setTranslationId,
      setError: setters.setError,
    });

    // Rebuild state from calls
    let state: TranslationItem[] = [];
    for (const [arg] of setters.setTranslatedText.mock.calls) {
      state = typeof arg === "function" ? arg(state) : arg;
    }

    expect(state).toEqual([{ type: "expression", value: "bonjour" }]);
    expect(setters.setIsLoading).toHaveBeenCalledWith(false);
    expect(setters.setSaveToHistory).toHaveBeenCalledWith(true);
    expect(result).toEqual({ success: true });
  });

  // ------ Test 3️⃣ ------
  it("handles 429 rate limit", async () => {
    fetchMock.mockResolvedValue({ status: 429, json: async () => ({ error: "Rate limit" }) });

    const result = await suggestExpressionHelper({
      detectedLang: "en",
      outputLang: "fr",
      fetcher: fetchMock,
      setTranslatedText: setters.setTranslatedText,
      setInputTextLang: setters.setInputTextLang,
      setSaveToHistory: setters.setSaveToHistory,
      setTranslatedTextLang: setters.setTranslatedTextLang,
      setExplanation: setters.setExplanation,
      setIsLoading: setters.setIsLoading,
      setIsFavorite: setters.setIsFavorite,
      setTranslationId: setters.setTranslationId,
      setError: setters.setError,
    });

    expect(setters.setError).toHaveBeenCalledWith("Rate limit");
    expect(setters.setIsLoading).toHaveBeenCalledWith(false);
    expect(result).toEqual({ success: false, error: "Rate limit" });
  });

  // ------ Test 4️⃣ ------
  it("handles fetch failure", async () => {
    fetchMock.mockRejectedValue(new Error("Network error"));

    const result = await suggestExpressionHelper({
      detectedLang: "en",
      outputLang: "fr",
      fetcher: fetchMock,
      setTranslatedText: setters.setTranslatedText,
      setInputTextLang: setters.setInputTextLang,
      setSaveToHistory: setters.setSaveToHistory,
      setTranslatedTextLang: setters.setTranslatedTextLang,
      setExplanation: setters.setExplanation,
      setIsLoading: setters.setIsLoading,
      setIsFavorite: setters.setIsFavorite,
      setTranslationId: setters.setTranslationId,
      setError: setters.setError,
    });

    expect(setters.setError).toHaveBeenCalledWith(expect.stringContaining("Oops!"));
    expect(setters.setIsLoading).toHaveBeenCalledWith(false);
    expect(result.success).toBe(false);
  });

  // ------ Test 5️⃣ ------
  it("blurs active element if present", async () => {
    // Create a mock input and add it to the document
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    // Spy on the blur method
    const blurSpy = jest.spyOn(input, "blur");

    // Mock fetch response
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ text: '["hola"]' }) });

    await suggestExpressionHelper({
      detectedLang: "en",
      outputLang: "fr",
      fetcher: fetchMock,
      setTranslatedText: setters.setTranslatedText,
      setInputTextLang: setters.setInputTextLang,
      setSaveToHistory: setters.setSaveToHistory,
      setTranslatedTextLang: setters.setTranslatedTextLang,
      setExplanation: setters.setExplanation,
      setIsLoading: setters.setIsLoading,
      setIsFavorite: setters.setIsFavorite,
      setTranslationId: setters.setTranslationId,
      setError: setters.setError,
    });

    // Verify that blur was called
    expect(blurSpy).toHaveBeenCalled();

    // Cleanup
    document.body.removeChild(input);
  });

  // ------ Test 6️⃣ ------
  it("throws error if fetch returns non-ok status", async () => {
    // Mock fetch to return a non-ok, non-429 status
    fetchMock.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });

    const result = await suggestExpressionHelper({
      detectedLang: "en",
      outputLang: "fr",
      fetcher: fetchMock,
      setTranslatedText: setters.setTranslatedText,
      setInputTextLang: setters.setInputTextLang,
      setSaveToHistory: setters.setSaveToHistory,
      setTranslatedTextLang: setters.setTranslatedTextLang,
      setExplanation: setters.setExplanation,
      setIsLoading: setters.setIsLoading,
      setIsFavorite: setters.setIsFavorite,
      setTranslationId: setters.setTranslationId,
      setError: setters.setError,
    });

    // Expect the error handler to be called with the Gemini error
    expect(setters.setError).toHaveBeenCalledWith(
      "Oops! Something went wrong on our server.\nPlease try again in a few moments 🙏"
    );
    expect(result.success).toBe(false);
  });
});

/**
 * @jest-environment jsdom
 */
import { renderHook, act, waitFor } from "@testing-library/react";
import { useExplanation } from "@traduxo/packages/hooks/explanation/useExplanation";

// ---- Mocks ----
// Mock setExplanation must accept called values (we're not testing streaming here)
const mockSetExplanation = jest.fn();

// Basic context values used by the hook
const mockTranslatedText = "translated";
const mockInputTextLang = "en";
const mockTranslatedTextLang = "fr";
const mockSystemLang = "en";

// Mock TranslationContext
jest.mock("@traduxo/packages/contexts/TranslationContext", () => ({
  useTranslationContext: () => ({
    translatedText: mockTranslatedText,
    setExplanation: mockSetExplanation,
    inputTextLang: mockInputTextLang,
    translatedTextLang: mockTranslatedTextLang,
  }),
}));

// Mock LanguageContext
jest.mock("@traduxo/packages/contexts/LanguageContext", () => ({
  useLanguageContext: () => ({
    systemLang: mockSystemLang,
  }),
}));

// Mock Gemini prompt generator (must return a string)
const fakePrompt = "fake prompt";
jest.mock("@traduxo/packages/utils/geminiPrompts", () => ({
  getExplanationPrompt: jest.fn(() => fakePrompt),
}));

// Constant used in hook - if you import a different path, adjust this mock accordingly
jest.mock("@traduxo/packages/utils/config/apiBase", () => ({
  API_BASE_URL: "https://api.example.com",
}));

describe("useExplanation (non-streaming behavior)", () => {
  let mockFetcher: jest.Mock;

  beforeEach(() => {
    mockFetcher = jest.fn();
  });

  // ------ Test 1️⃣ ------
  it("returns false and sets explanationError when server returns 429", async () => {
    mockFetcher.mockResolvedValue({
      status: 429,
      json: async () => ({ error: "Quota exceeded" }),
    });

    const { result } = renderHook(() => useExplanation({ fetcher: mockFetcher }));

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.handleExplanation();
    });

    expect(success).toBe(false);
    expect(result.current.explanationError).toBe("Quota exceeded");
    // fetch should have been called once
    expect(mockFetcher).toHaveBeenCalledTimes(1);
  });

  // ------ Test 2️⃣ ------
  it("handles non-ok responses without body and sets generic error", async () => {
    mockFetcher.mockResolvedValue({
      ok: false,
      body: null,
      status: 500,
      json: async () => ({}),
    });

    const { result } = renderHook(() => useExplanation({ fetcher: mockFetcher }));

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.handleExplanation();
    });

    expect(success).toBe(false);
    expect(result.current.explanationError).toBe(
      "Oops! Something went wrong on our server.\nPlease try again in a few moments 🙏"
    );
    expect(mockFetcher).toHaveBeenCalledTimes(1);
  });

  // ------ Test 3️⃣ ------
  it("handles fetch exceptions gracefully and sets generic error", async () => {
    mockFetcher.mockRejectedValue(new Error("network fail"));

    const { result } = renderHook(() => useExplanation({ fetcher: mockFetcher }));

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.handleExplanation();
    });

    expect(success).toBe(false);
    expect(result.current.explanationError).toBe(
      "Oops! Something went wrong on our server.\nPlease try again in a few moments 🙏"
    );
    expect(mockFetcher).toHaveBeenCalledTimes(1);
  });

  // ------ Test 4️⃣ ------
  it("toggles isExpLoading correctly during execution (resets on error)", async () => {
    // Return a non-streaming but ok response to exercise loading toggle until failure on missing body
    mockFetcher.mockResolvedValue({
      ok: true,
      body: null, // hook expects body or injected reader; this will cause the generic error path
    });

    const { result } = renderHook(() => useExplanation({ fetcher: mockFetcher }));

    expect(result.current.isExpLoading).toBe(false);

    await act(async () => {
      const success = await result.current.handleExplanation();
      expect(success).toBe(false);
      // while call in progress, hook sets loading; we assert after call completes that it is reset
    });

    expect(result.current.isExpLoading).toBe(false);
    expect(result.current.explanationError).toBe(
      "Oops! Something went wrong on our server.\nPlease try again in a few moments 🙏"
    );
  });

  // ------ Test 5️⃣ ------
  it("uses res.body.getReader() from the fetch response when reader is not injected", async () => {
    // create a reader whose read() reports done immediately
    const readerMock = { read: jest.fn().mockResolvedValue({ done: true }) };
    const getReaderSpy = jest.fn(() => readerMock);

    mockFetcher.mockResolvedValue({
      ok: true,
      body: { getReader: getReaderSpy },
    });

    const { result } = renderHook(() => useExplanation({ fetcher: mockFetcher }));

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.handleExplanation();
    });

    expect(success).toBe(true);

    // fetcher should have been called and body.getReader should have been used
    expect(mockFetcher).toHaveBeenCalledTimes(1);
    expect(getReaderSpy).toHaveBeenCalled();
  });
})

// Low functions test coverage because streamed response isn't tested

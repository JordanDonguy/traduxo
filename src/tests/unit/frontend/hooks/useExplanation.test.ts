/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
import { useExplanation } from "@/lib/client/hooks/useExplanation";

// ---- Mocks ----
// These mocks replace the real context for isolated hook testing.
const mockSetExplanation = jest.fn();
const mockTranslatedText = "translated";
const mockInputTextLang = "en";
const mockTranslatedTextLang = "fr";
const mockSystemLang = "en";

// Mock TranslationContext
jest.mock("@/context/TranslationContext", () => ({
  useTranslationContext: () => ({
    translatedText: mockTranslatedText,
    setExplanation: mockSetExplanation,
    inputTextLang: mockInputTextLang,
    translatedTextLang: mockTranslatedTextLang,
  }),
}));

// Mock LanguageContext
jest.mock("@/context/LanguageContext", () => ({
  useLanguageContext: () => ({
    systemLang: mockSystemLang,
  }),
}));

// Mock Gemini prompt generator
jest.mock("@/lib/shared/geminiPrompts", () => ({
  getExplanationPrompt: jest.fn(() => "fake prompt"),
}));


// ---- Tests ----
describe("useExplanation", () => {
  let mockFetcher: jest.Mock;

  beforeEach(() => {
    mockFetcher = jest.fn();
  });

  // ------ Test 1️⃣ ------
  it("blurs active element if documentRef is provided", async () => {
    const blurFn = jest.fn();
    const fakeActiveElement = document.createElement("div");
    fakeActiveElement.blur = blurFn;

    const fakeDoc = { activeElement: fakeActiveElement } as unknown as Document;

    const { result } = renderHook(() =>
      useExplanation({ fetcher: mockFetcher, documentRef: fakeDoc })
    );

    // Mock fetch to skip streaming chunks
    mockFetcher.mockResolvedValue({
      ok: true,
      body: { getReader: () => ({ read: jest.fn().mockResolvedValue({ done: true }) }) },
    });

    await act(async () => {
      await result.current.handleExplanation();
    });

    // Verify blur was called
    expect(blurFn).toHaveBeenCalled();
  });

  // ------ Test 2️⃣ ------
  it("handles 429 quota errors", async () => {
    mockFetcher.mockResolvedValue({
      status: 429,
      json: async () => ({ error: "Quota exceeded" }),
    });

    const { result } = renderHook(() => useExplanation({ fetcher: mockFetcher }));

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.handleExplanation();
    });

    // Should return false and set the correct error message
    expect(success).toBe(false);
    expect(result.current.explanationError).toBe("Quota exceeded");
  });

  // ------ Test 3️⃣ ------
  it("handles non-ok responses without body", async () => {
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

    // Should fallback to generic error
    expect(success).toBe(false);
    expect(result.current.explanationError).toBe(
      "Oops! Something went wrong on our server.\nPlease try again in a few moments 🙏"
    );
  });

  // ------ Test 4️⃣ ------
  it("handles fetch exceptions gracefully", async () => {
    mockFetcher.mockRejectedValue(new Error("network fail"));

    const { result } = renderHook(() => useExplanation({ fetcher: mockFetcher }));

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.handleExplanation();
    });

    // Should fallback to generic error
    expect(success).toBe(false);
    expect(result.current.explanationError).toBe(
      "Oops! Something went wrong on our server.\nPlease try again in a few moments 🙏"
    );
  });

  // ------ Test 5️⃣ ------
  it("sets loading states correctly during normal flow", async () => {
    mockFetcher.mockResolvedValue({
      ok: true,
      body: null, // skipping streaming for this test
    });

    const { result } = renderHook(() => useExplanation({ fetcher: mockFetcher }));

    // Initial loading state
    expect(result.current.isExpLoading).toBe(false);

    await act(async () => {
      const success = await result.current.handleExplanation();
      // Streaming skipped; only verifying loading toggle
      expect(success).toBe(false);
    });

    // Loading should always reset
    expect(result.current.isExpLoading).toBe(false);

    // Error should be set due to skipped streaming
    expect(result.current.explanationError).toBe(
      "Oops! Something went wrong on our server.\nPlease try again in a few moments 🙏"
    );
  });
});

// Note: Branch and function coverage are limited because streaming response handling is not tested

import { suggestExpressionHelper } from "@/lib/client/utils/suggestExpression";

describe("suggestExpressionHelper", () => {
  let fetchMock: jest.Mock;
  let setters: Record<string, jest.Mock>;

  beforeEach(() => {
    fetchMock = jest.fn();
    setters = {
      setTranslatedText: jest.fn(),
      setInputTextLang: jest.fn(),
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
      setTranslatedTextLang: setters.setTranslatedTextLang,
      setExplanation: setters.setExplanation,
      setIsLoading: setters.setIsLoading,
      setIsFavorite: setters.setIsFavorite,
      setTranslationId: setters.setTranslationId,
      setError: setters.setError,
    });

    // Ensure all state setters are called to reset before fetch
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
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ text: '["bonjour"]' }) });

    const result = await suggestExpressionHelper({
      detectedLang: "en",
      outputLang: "fr",
      fetcher: fetchMock,
      setTranslatedText: setters.setTranslatedText,
      setInputTextLang: setters.setInputTextLang,
      setTranslatedTextLang: setters.setTranslatedTextLang,
      setExplanation: setters.setExplanation,
      setIsLoading: setters.setIsLoading,
      setIsFavorite: setters.setIsFavorite,
      setTranslationId: setters.setTranslationId,
      setError: setters.setError,
    });

    expect(setters.setTranslatedText).toHaveBeenCalledWith(["bonjour"]);
    expect(setters.setIsLoading).toHaveBeenCalledWith(false);
    expect(result).toEqual({ success: true, data: ["bonjour"] });
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
});

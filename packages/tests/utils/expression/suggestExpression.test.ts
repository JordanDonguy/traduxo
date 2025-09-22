/**
 * @jest-environment jsdom
 */
import { suggestExpressionHelper } from "@traduxo/packages/utils/expression/suggestExpression";
import { TextEncoder, TextDecoder } from "util";
import { blurActiveInput } from "@traduxo/packages/utils/ui/blurActiveInput";
import { TranslationItem } from "@traduxo/packages/types/translation";

(globalThis as unknown as { TextEncoder: typeof TextEncoder }).TextEncoder = TextEncoder;
(globalThis as unknown as { TextDecoder: typeof TextDecoder }).TextDecoder = TextDecoder;

// ---- Mocks ----
jest.mock("@traduxo/packages/utils/ui/blurActiveInput");

const fetchMock = jest.fn();
const setTranslatedText = jest.fn();
const setInputTextLang = jest.fn();
const setSaveToHistory = jest.fn();
const setTranslatedTextLang = jest.fn();
const setExplanation = jest.fn();
const setIsLoading = jest.fn();
const setIsFavorite = jest.fn();
const setTranslationId = jest.fn();
const setError = jest.fn();

const defaultArgs = {
  detectedLang: "en",
  outputLang: "fr",
  setTranslatedText,
  setInputTextLang,
  setSaveToHistory,
  setTranslatedTextLang,
  setExplanation,
  setIsLoading,
  setIsFavorite,
  setTranslationId,
  setError
}

// ---- Tests ----
describe("suggestExpressionHelper", () => {

  it("calls blurActiveInput", async () => {
    const fakeFetcher = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: { getReader: () => ({ read: jest.fn().mockResolvedValue({ done: true }) }) },
      json: jest.fn(),
    });

    await suggestExpressionHelper({ ...defaultArgs, fetcher: fakeFetcher });

    expect(blurActiveInput).toHaveBeenCalled();
  });

  // ------ Test 1️⃣ ------
  it("resets state correctly", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ text: '["hello"]' }) });

    await suggestExpressionHelper({ ...defaultArgs, fetcher: fetchMock });

    // ---- Check all state resets ----
    expect(setIsLoading).toHaveBeenCalledWith(true);
    expect(setError).toHaveBeenCalledWith("");
    expect(setTranslatedText).toHaveBeenCalledWith([]);
    expect(setExplanation).toHaveBeenCalledWith("");
    expect(setIsFavorite).toHaveBeenCalledWith(false);
    expect(setTranslationId).toHaveBeenCalledWith(undefined);
    expect(setInputTextLang).toHaveBeenCalledWith("en");
    expect(setTranslatedTextLang).toHaveBeenCalledWith("fr");
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

    const result = await suggestExpressionHelper({ ...defaultArgs, fetcher: fakeFetcher });

    // Rebuild state from calls
    let state: TranslationItem[] = [];
    for (const [arg] of setTranslatedText.mock.calls) {
      state = typeof arg === "function" ? arg(state) : arg;
    }

    expect(state).toEqual([{ type: "expression", value: "bonjour" }]);
    expect(setIsLoading).toHaveBeenCalledWith(false);
    expect(setSaveToHistory).toHaveBeenCalledWith(true);
    expect(result).toEqual({ success: true });
  });

  // ------ Test 3️⃣ ------
  it("handles 429 rate limit", async () => {
    fetchMock.mockResolvedValue({ status: 429, json: async () => ({ error: "Rate limit" }) });

    const result = await suggestExpressionHelper({ ...defaultArgs, fetcher: fetchMock });

    expect(setError).toHaveBeenCalledWith("Rate limit");
    expect(setIsLoading).toHaveBeenCalledWith(false);
    expect(result).toEqual({ success: false, error: "Rate limit" });
  });

  // ------ Test 4️⃣ ------
  it("handles fetch failure", async () => {
    fetchMock.mockRejectedValue(new Error("Network error"));

    const result = await suggestExpressionHelper({ ...defaultArgs, fetcher: fetchMock });

    expect(setError).toHaveBeenCalledWith(expect.stringContaining("Oops!"));
    expect(setIsLoading).toHaveBeenCalledWith(false);
    expect(result.success).toBe(false);
  });

  // ------ Test 6️⃣ ------
  it("throws error if fetch returns non-ok status", async () => {
    // Mock fetch to return a non-ok, non-429 status
    fetchMock.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });

    const result = await suggestExpressionHelper({ ...defaultArgs, fetcher: fetchMock });

    // Expect the error handler to be called with the Gemini error
    expect(setError).toHaveBeenCalledWith(
      "Oops! Something went wrong on our server.\nPlease try again in a few moments 🙏"
    );
    expect(result.success).toBe(false);
  });

  // ------ Test 7️⃣ ------
  it("handles non-string item.value without throwing", async () => {
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
                JSON.stringify({ type: "expression", value: 12345 }) + "\n" // number instead of string
              ),
            })
            .mockResolvedValueOnce({ done: true, value: undefined }),
        }),
      },
    });

    const result = await suggestExpressionHelper({ ...defaultArgs, fetcher: fakeFetcher });

    // Rebuild state from calls
    let state: TranslationItem[] = [];
    for (const [arg] of setTranslatedText.mock.calls) {
      state = typeof arg === "function" ? arg(state) : arg;
    }

    // The value should stay as a number
    expect(state).toEqual([{ type: "expression", value: 12345 }]);
    expect(setIsLoading).toHaveBeenCalledWith(false);
    expect(setSaveToHistory).toHaveBeenCalledWith(true);
    expect(result).toEqual({ success: true });
  });

  // ------ Test 8️⃣ ------
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

    await suggestExpressionHelper({ ...defaultArgs });

    expect(globalThis.fetch).toHaveBeenCalled();
  });

  // ------ Test 9️⃣ ------
  it("adds Authorization header when token is provided", async () => {
    const token = "fake-token-123";

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
                JSON.stringify({ type: "expression", value: "hola" }) + "\n"
              ),
            })
            .mockResolvedValueOnce({ done: true, value: undefined }),
        }),
      },
    });

    const result = await suggestExpressionHelper({
      ...defaultArgs,
      fetcher: fakeFetcher,
      token,
    });

    // Check that fetcher was called with Authorization header
    const fetchCallArgs = fakeFetcher.mock.calls[0][1]; // second argument of first call
    expect(fetchCallArgs?.headers).toMatchObject({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    });
  });
});

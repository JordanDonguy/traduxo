import { fetchExpressionPoolHelper } from "@/lib/client/utils/fetchExpressionPool";

describe("fetchExpressionPoolHelper", () => {
  let setExpressionPool: jest.Mock;
  let setError: jest.Mock;
  let fetcher: jest.Mock;
  let promptGetter: jest.Mock;
  let responseCleaner: jest.Mock;

  beforeEach(() => {
    setExpressionPool = jest.fn();
    setError = jest.fn();
    fetcher = jest.fn();
    promptGetter = jest.fn().mockReturnValue("test prompt");
    responseCleaner = jest.fn().mockImplementation((x) => x);
  });

  // ------ Test 1️⃣ ------
  it("fetches and sets cleaned expression pool on success", async () => {
    const fakeArray = ["hello...", "world..."];
    fetcher.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ text: JSON.stringify(fakeArray) }),
    });

    const result = await fetchExpressionPoolHelper({
      suggestionLang: "en",
      setExpressionPool,
      setError,
      fetcher,
      promptGetter,
      responseCleaner,
    });

    // Ensures prompt is generated, fetch is called, response is cleaned, and state updated
    expect(promptGetter).toHaveBeenCalledWith("en");
    expect(fetcher).toHaveBeenCalledWith("/api/gemini/complete", expect.any(Object));
    expect(responseCleaner).toHaveBeenCalled();
    expect(setExpressionPool).toHaveBeenCalledWith(["hello", "world"]);
    expect(result).toEqual({ success: true, data: ["hello", "world"] });
  });

  // ------ Test 2️⃣ ------
  it("handles 429 response and sets error", async () => {
    fetcher.mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ error: "Rate limit exceeded" }),
    });

    const result = await fetchExpressionPoolHelper({
      suggestionLang: "fr",
      setExpressionPool,
      setError,
      fetcher,
      promptGetter,
      responseCleaner,
    });

    // Should set the error from server response and return failure
    expect(setError).toHaveBeenCalledWith("Rate limit exceeded");
    expect(result).toEqual({ success: false, error: "Rate limit exceeded" });
  });

  // ------ Test 3️⃣ ------
  it("handles non-ok response by throwing error", async () => {
    fetcher.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    const result = await fetchExpressionPoolHelper({
      suggestionLang: "es",
      setExpressionPool,
      setError,
      fetcher,
      promptGetter,
      responseCleaner,
    });

    // Should handle unexpected HTTP errors gracefully
    expect(setError).toHaveBeenCalledWith(
      "Oops! Something went wrong on our server.\nPlease try again in a few moments 🙏"
    );
    expect(result.success).toBe(false);
  });

  // ------ Test 4️⃣ ------
  it("handles unexpected errors gracefully", async () => {
    fetcher.mockRejectedValue(new Error("network down"));

    const result = await fetchExpressionPoolHelper({
      suggestionLang: "de",
      setExpressionPool,
      setError,
      fetcher,
      promptGetter,
      responseCleaner,
    });

    // Should handle network or other exceptions gracefully
    expect(setError).toHaveBeenCalledWith(
      "Oops! Something went wrong on our server.\nPlease try again in a few moments 🙏"
    );
    expect(result.success).toBe(false);
  });
});

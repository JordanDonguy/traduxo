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

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ------ Test 1️⃣ ------
  it("returns early if inputText is empty", async () => {
    const res = await translationHelper({ ...defaultArgs, inputText: "" });
    expect(res).toEqual({ success: false, message: "No input text" });
    expect(mockSet).not.toHaveBeenCalled();
  });

  // ------ Test 2️⃣ ------
  it("sets state correctly on successful translation", async () => {
    const fakeText = JSON.stringify(["Bonjour"]);
    const fakeFetcher = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ text: fakeText }),
    });

    const res = await translationHelper({
      ...defaultArgs,
      fetcher: fakeFetcher,
      responseCleaner: (s) => s, // return raw string
    });

    expect(res).toEqual({ success: true, data: ["Bonjour"] });
    expect(mockSet).toHaveBeenCalledWith(["Bonjour"]);
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
    expect(mockSet).toHaveBeenCalledWith("Rate limit exceeded");
  });

  // ------ Test 4️⃣ ------
  it("handles generic fetch error", async () => {
    const fakeFetcher = jest.fn().mockRejectedValue(new Error("Network error"));

    const res = await translationHelper({
      ...defaultArgs,
      fetcher: fakeFetcher,
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain("Oops! Something went wrong");
    expect(mockSet).toHaveBeenCalledWith(expect.stringContaining("Oops! Something went wrong"));
  });
});

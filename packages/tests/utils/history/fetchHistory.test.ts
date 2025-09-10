import { fetchHistory } from "@traduxo/packages/utils/history/fetchHistory";
import { Translation } from "@traduxo/packages/types/translation";

describe("fetchHistory", () => {
  let setTranslationHistory: jest.Mock;

  beforeEach(() => {
    setTranslationHistory = jest.fn();
  });

  // ------ Test 1️⃣ ------
  it("does nothing if status is 'loading'", async () => {
    const fetchFn = jest.fn();

    // Should skip fetching when status is 'loading'
    await fetchHistory({ status: "loading", setTranslationHistory, fetchFn });

    expect(fetchFn).not.toHaveBeenCalled();
    expect(setTranslationHistory).not.toHaveBeenCalled();
  });

  // ------ Test 2️⃣ ------
  it("sets empty array if response status is 204", async () => {
    const fetchFn = jest.fn().mockResolvedValue({
      status: 204,
      ok: true,
    });

    await fetchHistory({ status: "idle", setTranslationHistory, fetchFn });

    // 204 indicates no content, state should be empty array
    expect(setTranslationHistory).toHaveBeenCalledWith([]);
  });

  // ------ Test 3️⃣ ------
  it("sets translation history if response is OK", async () => {
    const fakeData: Translation[] = [
      { id: "1", inputText: "Hello", translation: "Bonjour", inputLang: "en", outputLang: "fr", alt1: "Salut", alt2: "Hey", alt3: "Bonsoir" },
      { id: "2", inputText: "Bye", translation: "Au revoir", inputLang: "en", outputLang: "fr", alt1: "Salut", alt2: "Bye", alt3: "À bientôt" },
    ];

    const fetchFn = jest.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => fakeData,
    });

    await fetchHistory({ status: "idle", setTranslationHistory, fetchFn });

    // Should set the fetched translation history
    expect(setTranslationHistory).toHaveBeenCalledWith(fakeData);
  });

  // ------ Test 4️⃣ ------
  it("logs error if response is not OK", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => { });
    const fetchFn = jest.fn().mockResolvedValue({
      status: 500,
      ok: false,
      statusText: "Internal Server Error",
    });

    await fetchHistory({ status: "idle", setTranslationHistory, fetchFn });

    // Error should be logged, state unchanged
    expect(setTranslationHistory).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith("Failed to fetch history:", "Internal Server Error");

    consoleSpy.mockRestore();
  });

  // ------ Test 5️⃣ ------
  it("logs error on fetch rejection", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => { });
    const fetchFn = jest.fn().mockRejectedValue(new Error("network down"));

    await fetchHistory({ status: "idle", setTranslationHistory, fetchFn });

    // Network or other fetch errors should be logged, state unchanged
    expect(setTranslationHistory).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith("Error fetching history:", expect.any(Error));

    consoleSpy.mockRestore();
  });

  // ------ Test 6️⃣ ------
  it("uses global fetch when fetchFn is not provided", async () => {
    const setTranslationHistory = jest.fn();

    // mock global fetch
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue([{ id: 1, text: "test" }]),
    });
    (globalThis as any).fetch = mockFetch;

    await fetchHistory({ status: "idle", setTranslationHistory });

    expect(mockFetch).toHaveBeenCalled(); // confirms default fetch was used
    expect(setTranslationHistory).toHaveBeenCalledWith([{ id: 1, text: "test" }]);
  });
});

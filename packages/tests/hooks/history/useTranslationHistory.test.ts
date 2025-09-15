/**
 * @jest-environment jsdom
 */
import { renderHook, act, waitFor } from "@testing-library/react";
import { useTranslationHistory } from "@traduxo/packages/hooks/history/useTranslationHistory";
import { Translation } from "@traduxo/packages/types/translation";

// ---- Mocks ----
const mockSetTranslationHistory = jest.fn();
const mockSelectTranslation = jest.fn();

// Mock TranslationContext
jest.mock("@traduxo/packages/contexts/TranslationContext", () => ({
  useTranslationContext: () => ({
    translationHistory: [{ id: "1", inputText: "foo" }],
    setTranslationHistory: mockSetTranslationHistory,
  }),
}));

// Mock useAuth
jest.mock("@traduxo/packages/contexts/AuthContext", () => ({
  useAuth: jest.fn(() => ({ status: "authenticated", token: "fake-token" })),
}));

// Mock toast
jest.mock("react-toastify", () => ({
  toast: { error: jest.fn() },
}));
import { toast } from "react-toastify";

// Mock fetchHistory
jest.mock("@traduxo/packages/utils/history/fetchHistory", () => ({
  fetchHistory: jest.fn(),
}));
import { fetchHistory } from "@traduxo/packages/utils/history/fetchHistory";

// Mock useSelectTranslation
jest.mock("@traduxo/packages/hooks/translation/useSelectTranslation", () => ({
  useSelectTranslation: () => ({ selectTranslation: mockSelectTranslation }),
}));

describe("useTranslationHistory", () => {
  let mockFetcher: jest.Mock;

  beforeEach(() => {
    mockFetcher = jest.fn();
  });

  // ------ Test 1️⃣ ------
  it("fetches history on mount and sets loading false", async () => {
    (fetchHistory as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useTranslationHistory({ fetcher: mockFetcher }));

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(fetchHistory).toHaveBeenCalled();
      expect(result.current.isLoading).toBe(false);
    });
  });

  // ------ Test 2️⃣ ------
  it("deletes a translation successfully", async () => {
    mockFetcher.mockResolvedValue({ ok: true, json: jest.fn() });

    const { result } = renderHook(() =>
      useTranslationHistory({ fetcher: mockFetcher })
    );

    let outcome: boolean | undefined;
    await act(async () => {
      outcome = await result.current.deleteTranslation("1");
    });

    expect(outcome).toBe(true);
    expect(mockSetTranslationHistory).toHaveBeenCalledWith(expect.any(Function));
  });

  // ------ Test 3️⃣ ------
  it("calls toast.error when deletion fails (server error)", async () => {
    mockFetcher.mockResolvedValue({
      ok: false,
      json: async () => ({ error: "boom" }),
    });

    const { result } = renderHook(() =>
      useTranslationHistory({ fetcher: mockFetcher })
    );

    await act(async () => {
      await result.current.deleteTranslation("1");
    });

    expect(toast.error).toHaveBeenCalledWith("boom");
  });

  // ------ Test 4️⃣ ------
  it("calls toast.error when fetch throws (network fail)", async () => {
    mockFetcher.mockRejectedValue(new Error("network fail"));

    const { result } = renderHook(() =>
      useTranslationHistory({ fetcher: mockFetcher })
    );

    await act(async () => {
      await result.current.deleteTranslation("1");
    });

    expect(toast.error).toHaveBeenCalledWith("network fail");
  });

  // ------ Test 5️⃣ ------
  it("delegates to selectTranslation with favorite=false", () => {
    const { result } = renderHook(() => useTranslationHistory({ fetcher: mockFetcher }));
    const fakeTranslation = { id: "1", inputText: "Hello", translation: "Bonjour", inputLang: "en", outputLang: "fr", alt1: "Salut", alt2: "Hey", alt3: "Bonsoir" };

    act(() => {
      result.current.selectTranslation(fakeTranslation);
    });

    expect(mockSelectTranslation).toHaveBeenCalledWith(fakeTranslation, false);
  });

  // ------ Test 6️⃣ ------
  it("falls back to generic message if res.json throws", async () => {
    mockFetcher.mockResolvedValue({
      ok: false,
      json: async () => { throw new Error("bad json"); },
    });

    const { result } = renderHook(() =>
      useTranslationHistory({ fetcher: mockFetcher })
    );

    await act(async () => {
      const success = await result.current.deleteTranslation("1");
      expect(success).toBe(false);
    });

    expect(toast.error).toHaveBeenCalledWith("Failed to delete translation");
  });

  // ------ Test 7️⃣ ------
  it("handles non-Error throws with fallback message", async () => {
    // Simulate a non-Error being thrown
    mockFetcher.mockImplementation(() => { throw "plain string"; });

    const { result } = renderHook(() =>
      useTranslationHistory({ fetcher: mockFetcher })
    );

    await act(async () => {
      const success = await result.current.deleteTranslation("1");
      expect(success).toBe(false);
    });

    expect(toast.error).toHaveBeenCalledWith("An error occurred");
  });

  // ------ Test 8️⃣ ------
  it("uses injected selectTranslationHook instead of default", async () => {
    // We create a jest mock function to track calls to `selectTranslation`
    // Then we create a properly typed hook object matching the expected shape of `selectTranslationHook`
    // `fakeTranslation` is a sample Translation object used for testing
    const mockSelect = jest.fn();
    const fakeTranslation = { id: "1", inputText: "Hello", translation: "Bonjour", inputLang: "en", outputLang: "fr", alt1: "Salut", alt2: "Hey", alt3: "Bonsoir" };
    const mockSelectTranslationHook: { selectTranslation: (fakeTranslation: Translation, isFavorite: boolean) => void } = {
      selectTranslation: mockSelect,
    };

    const { result } = renderHook(() =>
      useTranslationHistory({
        fetcher: mockFetcher,
        selectTranslationHook: mockSelectTranslationHook,
      })
    );


    act(() => {
      result.current.selectTranslation(fakeTranslation);
    });

    expect(mockSelect).toHaveBeenCalledWith(fakeTranslation, false);
  });

  // ------ Test 9️⃣ ------
  it("removes the correct translation from history after successful deletion", async () => {
    mockFetcher.mockResolvedValue({ ok: true, json: jest.fn() });

    const { result } = renderHook(() =>
      useTranslationHistory({ fetcher: mockFetcher })
    );

    await act(async () => {
      await result.current.deleteTranslation("1");
    });

    // Grab the updater function that was passed to setTranslationHistory
    expect(mockSetTranslationHistory).toHaveBeenCalledWith(expect.any(Function));
    const updateFn = (mockSetTranslationHistory as jest.Mock).mock.calls[0][0];

    // Apply it to a fake history and check that "1" gets removed
    const prev = [
      { id: "1", inputText: "foo" },
      { id: "2", inputText: "bar" },
    ];
    const next = updateFn(prev);
    expect(next).toEqual([{ id: "2", inputText: "bar" }]);
  });

  // ------ Test 🔟 ------
  it("returns false immediately from deleteTranslation if no token", async () => {
    const useAuth = require("@traduxo/packages/contexts/AuthContext").useAuth as jest.Mock;
    useAuth.mockReturnValue({ status: "unauthenticated", token: undefined });

    const { result } = renderHook(() =>
      useTranslationHistory({ fetcher: mockFetcher })
    );

    let outcome: boolean | undefined;
    await act(async () => {
      outcome = await result.current.deleteTranslation("123");
    });

    expect(outcome).toBe(false);
    expect(mockFetcher).not.toHaveBeenCalled(); // should bail out early
    expect(mockSetTranslationHistory).not.toHaveBeenCalled();
  });
});

// Note: Branches for internal fetchHistory implementation remain untested (mocked).

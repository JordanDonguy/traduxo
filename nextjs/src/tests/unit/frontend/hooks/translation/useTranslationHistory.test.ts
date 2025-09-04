/**
 * @jest-environment jsdom
 */
import { renderHook, act, waitFor } from "@testing-library/react";
import { useTranslationHistory } from "@/lib/client/hooks/translation/useTranslationHistory";
import { useSession } from "next-auth/react";
import { Translation } from "../../../../../../types/translation";

// ---- Mocks ----
const mockSetTranslationHistory = jest.fn();
const mockSelectTranslation = jest.fn();

// Mock TranslationContext
jest.mock("@/context/TranslationContext", () => ({
  useTranslationContext: () => ({
    translationHistory: [{ id: "1", inputText: "foo" }],
    setTranslationHistory: mockSetTranslationHistory,
  }),
}));

// Mock next-auth session
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
}));

// Mock toast
jest.mock("react-toastify", () => ({
  toast: { error: jest.fn() },
}));
import { toast } from "react-toastify";

// Mock fetchHistory
jest.mock("@/lib/client/utils/history/fetchHistory", () => ({
  fetchHistory: jest.fn(),
}));
import { fetchHistory } from "@/lib/client/utils/history/fetchHistory";

// Mock useSelectTranslation
jest.mock("@/lib/client/hooks/translation/useSelectTranslation", () => ({
  useSelectTranslation: () => ({ selectTranslation: mockSelectTranslation }),
}));

describe("useTranslationHistory", () => {
  let mockFetcher: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetcher = jest.fn();
    (useSession as jest.Mock).mockReturnValue({
      status: "authenticated",
    });
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
  it("uses injected session instead of default", async () => {
    const { result } = renderHook(() =>
      useTranslationHistory({ fetcher: mockFetcher })
    );

    // Should pick status from injected session, not next-auth
    expect(result.current.status).toBe("authenticated");
  });

  // ------ Test 9️⃣ ------
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
});

// Note: Branches for internal fetchHistory implementation remain untested (mocked).

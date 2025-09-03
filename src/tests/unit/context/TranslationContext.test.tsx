/**
 * @jest-environment jsdom
 */

import React from "react";
import { renderHook, RenderHookResult, act, waitFor } from "@testing-library/react";
import { TranslationProvider, useTranslationContext } from "@/context/TranslationContext";
import * as AppContextModule from "@/context/AppContext";
import AppProvider from "@/context/AppContext";
import { useSession } from "next-auth/react";
import { fetchHistory } from "@/lib/client/utils/fetchHistory";

// ---- Mocks ----
jest.mock("next-themes", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("next-auth/react", () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useSession: jest.fn(),
}));

jest.mock("@/lib/client/utils/fetchHistory", () => ({
  fetchHistory: jest.fn(),
}));

jest.mock("@/context/LanguageContext", () => ({
  LanguageProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("react-toastify", () => ({
  ToastContainer: () => <div />,
}));

// ---- Helpers ----
const Providers = ({ children }: React.PropsWithChildren) => (
  <AppProvider>
    <TranslationProvider>{children}</TranslationProvider>
  </AppProvider>
);

const mockUseApp = (mockSetError = jest.fn()) => {
  jest.spyOn(AppContextModule, "useApp").mockReturnValue({
    showLoginForm: false,
    setShowLoginForm: jest.fn(),
    error: "",
    setError: mockSetError,
    isLoading: false,
    setIsLoading: jest.fn(),
  });
  return mockSetError;
};

type TranslationContextType = ReturnType<typeof useTranslationContext>;
const setTranslationData = (
  result: RenderHookResult<TranslationContextType, unknown>["result"]
) =>
  act(() => {
    result.current.setTranslatedText([
      { type: "expression", value: "a" },
      { type: "main_translation", value: "b" },
      { type: "alternative", value: "" },
      { type: "alternative", value: "" },
      { type: "alternative", value: "" },
    ]);
    result.current.setInputTextLang("en");
    result.current.setTranslatedTextLang("fr");
  });

// ---- Tests ----
describe("TranslationContext", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ------ Test 1️⃣ ------
  it("throws if used outside provider", () => {
    expect(() => renderHook(() => useTranslationContext())).toThrow(
      "useTranslationContext must be used inside a TranslationProvider"
    );
  });

  // ------ Test 2️⃣ ------
  it("provides state inside provider", () => {
    (useSession as jest.Mock).mockReturnValue({ status: "unauthenticated" });
    const { result } = renderHook(() => useTranslationContext(), { wrapper: Providers });

    act(() => {
      result.current.setInputText("hello");
    });

    expect(result.current.inputText).toBe("hello");
  });

  // ------ Test 3️⃣ ------
  it("calls saveTranslation when authenticated and saveToHistory is true", async () => {
    (useSession as jest.Mock).mockReturnValue({ status: "authenticated" });

    // Mock fetch to resolve with a sample saved history object:
    const mockHistory = { id: 1, inputText: "Hello", translation: "Hola" };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockHistory }),
    }) as jest.Mock;

    const { result } = renderHook(() => useTranslationContext(), { wrapper: Providers });

    // set up data (so body isn’t empty)
    setTranslationData(result);

    // trigger the effect
    act(() => {
      result.current.setSaveToHistory(true);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/history",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })
      );

      // Check local state update
      expect(result.current.translationHistory).toContainEqual(mockHistory);
    });
  });

  // ------ Test 4️⃣ ------
  it("loadTranslationFromMenu sets state correctly when fromFavorite is false", () => {
    (useSession as jest.Mock).mockReturnValue({ status: "unauthenticated" });
    const { result } = renderHook(() => useTranslationContext(), { wrapper: Providers });

    const historyItem = {
      id: "2",
      inputText: "Hello",
      translation: "Bonjour",
      inputLang: "en",
      outputLang: "fr",
      alt1: "Salut",
      alt2: "Coucou",
      alt3: "Bonsoir",
    };

    act(() => {
      result.current.loadTranslationFromMenu(historyItem, false);
    });

    expect(result.current.isFavorite).toBe(false);
    expect(result.current.translationId).toBeUndefined();
    expect(result.current.translatedText).toEqual([
      { type: "expression", value: "Hello" },
      { type: "main_translation", value: "Bonjour" },
      { type: "alternative", value: "Salut" },
      { type: "alternative", value: "Coucou" },
      { type: "alternative", value: "Bonsoir" },
    ]);
    expect(result.current.inputTextLang).toBe("en");
    expect(result.current.translatedTextLang).toBe("fr");
  });

  // ------ Test 5️⃣ ------
  it("loadTranslationFromMenu sets state correctly when fromFavorite is true", () => {
    (useSession as jest.Mock).mockReturnValue({ status: "unauthenticated" });
    const { result } = renderHook(() => useTranslationContext(), { wrapper: Providers });

    const favoriteItem = {
      id: "42",
      inputText: "goodbye",
      translation: "au revoir",
      inputLang: "en",
      outputLang: "fr",
      alt1: null,
      alt2: null,
      alt3: null,
    };

    act(() => {
      result.current.loadTranslationFromMenu(favoriteItem, true);
    });

    expect(result.current.isFavorite).toBe(true);
    expect(result.current.translationId).toBe("42");
    expect(result.current.translatedText).toEqual([
      { type: "expression", value: "goodbye" },
      { type: "main_translation", value: "au revoir" },
      { type: "alternative", value: "" },          // alt1 fallback
      { type: "alternative", value: "" },  // alt2 filled
      { type: "alternative", value: "" },          // alt3 fallback
    ]);
    expect(result.current.inputTextLang).toBe("en");
    expect(result.current.translatedTextLang).toBe("fr");
  });

  // ------ Test 6️⃣ ------
  it("sets error when fetch returns !ok", async () => {
    const mockSetError = mockUseApp();
    (useSession as jest.Mock).mockReturnValue({ status: "authenticated" });

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Server error" }),
    }) as jest.Mock;

    const { result } = renderHook(() => useTranslationContext(), { wrapper: Providers });

    setTranslationData(result);
    act(() => {
      result.current.setSaveToHistory(true);
    });

    await waitFor(() => {
      expect(mockSetError).toHaveBeenCalledWith("Server error");
    });
  });

  // ------ Test 7️⃣ ------
  it("sets fallback error when fetch returns !ok without error field", async () => {
    const mockSetError = mockUseApp();
    (useSession as jest.Mock).mockReturnValue({ status: "authenticated" });

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({}),
    }) as jest.Mock;

    const { result } = renderHook(() => useTranslationContext(), { wrapper: Providers });

    setTranslationData(result);

    act(() => {
      result.current.setSaveToHistory(true);
    });

    await waitFor(() => {
      expect(mockSetError).toHaveBeenCalledWith("Failed to save translation");
    });
  });

  // ------ Test 8️⃣ ------
  it("sets error when fetch throws", async () => {
    const mockSetError = mockUseApp();
    (useSession as jest.Mock).mockReturnValue({ status: "authenticated" });

    global.fetch = jest.fn().mockRejectedValue(new Error("Network down")) as jest.Mock;

    const { result, rerender } = renderHook(() => useTranslationContext(), { wrapper: Providers });

    setTranslationData(result);
    act(() => {
      result.current.setSaveToHistory(true);
    });
    rerender();

    await waitFor(() => {
      expect(mockSetError).toHaveBeenCalledWith("Network error while saving translation");
    });
  });
});

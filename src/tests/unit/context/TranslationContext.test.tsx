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
  it("calls saveTranslation when authenticated and valid data", async () => {
    (useSession as jest.Mock).mockReturnValue({ status: "authenticated" });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    }) as jest.Mock;

    const { result, rerender } = renderHook(() => useTranslationContext(), { wrapper: Providers });

    setTranslationData(result);
    rerender();

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/history",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
    );

    expect(fetchHistory).toHaveBeenCalled();
  });

  // ------ Test 4️⃣ ------
  it("loadTranslationFromMenu sets state correctly when fromFavorite is false", () => {
    (useSession as jest.Mock).mockReturnValue({ status: "unauthenticated" });
    const { result } = renderHook(() => useTranslationContext(), { wrapper: Providers });

    const historyItem = {
      id: "2",
      inputText: "hello",
      translation: "bonjour",
      inputLang: "en",
      outputLang: "fr",
      alt1: "hi",
      alt2: null,
      alt3: null,
    };

    act(() => {
      result.current.loadTranslationFromMenu(historyItem, false);
    });

    expect(result.current.isFavorite).toBe(false);
    expect(result.current.translationId).toBeUndefined();
    expect(result.current.translatedText).toEqual([
      { type: "expression", value: "hello" },
      { type: "main_translation", value: "bonjour" },
      { type: "alternative", value: "hi" },
      { type: "alternative", value: "" },
      { type: "alternative", value: "" },
    ]);
    expect(result.current.inputTextLang).toBe("en");
    expect(result.current.translatedTextLang).toBe("fr");
  });

  // ------ Test 5️⃣ ------
  it("sets error when fetch returns !ok", async () => {
    const mockSetError = mockUseApp();
    (useSession as jest.Mock).mockReturnValue({ status: "authenticated" });

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Server error" }),
    }) as jest.Mock;

    const { result } = renderHook(() => useTranslationContext(), { wrapper: Providers });

    setTranslationData(result);

    await waitFor(() => {
      expect(mockSetError).toHaveBeenCalledWith("Server error");
    });
  });

  // ------ Test 6️⃣ ------
  it("sets fallback error when fetch returns !ok without error field", async () => {
    const mockSetError = mockUseApp();
    (useSession as jest.Mock).mockReturnValue({ status: "authenticated" });

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({}),
    }) as jest.Mock;

    const { result } = renderHook(() => useTranslationContext(), { wrapper: Providers });

    setTranslationData(result);

    await waitFor(() => {
      expect(mockSetError).toHaveBeenCalledWith("Failed to save translation");
    });
  });

  // ------ Test 7️⃣ ------
  it("sets error when fetch throws", async () => {
    const mockSetError = mockUseApp();
    (useSession as jest.Mock).mockReturnValue({ status: "authenticated" });

    global.fetch = jest.fn().mockRejectedValue(new Error("Network down")) as jest.Mock;

    const { result, rerender } = renderHook(() => useTranslationContext(), { wrapper: Providers });

    setTranslationData(result);
    rerender();

    await waitFor(() => {
      expect(mockSetError).toHaveBeenCalledWith("Network error while saving translation");
    });
  });

  // ------ Test 8️⃣ ------
  it("loadTranslationFromMenu handles favorites and alts correctly", () => {
    (useSession as jest.Mock).mockReturnValue({ status: "unauthenticated" });
    const { result } = renderHook(() => useTranslationContext(), { wrapper: Providers });

    const favoriteItem = {
      id: "1",
      inputText: "hi",
      translation: "salut",
      inputLang: "en",
      outputLang: "fr",
      alt1: null,
      alt2: null,
      alt3: null,
    };
    const nonFavoriteItem = {
      id: "2",
      inputText: "test",
      translation: "testé",
      inputLang: "en",
      outputLang: "fr",
      alt1: "essai",
      alt2: "épreuve",
      alt3: "tentative",
    };

    act(() => result.current.loadTranslationFromMenu(favoriteItem, true));
    expect(result.current.isFavorite).toBe(true);
    expect(result.current.translationId).toBe("1");
    expect(result.current.translatedText).toEqual([
      { type: "expression", value: "hi" },
      { type: "main_translation", value: "salut" },
      { type: "alternative", value: "" },
      { type: "alternative", value: "" },
      { type: "alternative", value: "" },
    ]);

    act(() => result.current.loadTranslationFromMenu(nonFavoriteItem, false));
    expect(result.current.isFavorite).toBe(false);
    expect(result.current.translationId).toBeUndefined();
    expect(result.current.translatedText).toEqual([
      { type: "expression", value: "test" },
      { type: "main_translation", value: "testé" },
      { type: "alternative", value: "essai" },
      { type: "alternative", value: "épreuve" },
      { type: "alternative", value: "tentative" },
    ]);
  });
});

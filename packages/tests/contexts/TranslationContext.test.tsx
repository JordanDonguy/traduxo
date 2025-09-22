/**
 * @jest-environment jsdom
 */

import React from "react";
import { renderHook, RenderHookResult, act, waitFor } from "@testing-library/react";
import { TranslationProvider, useTranslationContext } from "@traduxo/packages/contexts/TranslationContext";
import * as AppContextModule from "@traduxo/packages/contexts/AppContext";
import { AppProviderBase } from "@traduxo/packages/contexts/AppContext";
import { useAuth } from "@traduxo/packages/contexts/AuthContext";

// ---- Mocks ----
jest.mock("next-themes", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("@traduxo/packages/contexts/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@traduxo/packages/contexts/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@traduxo/packages/contexts/AuthContext", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: jest.fn(() => ({ status: "unauthenticated", token: null })),
}));

jest.mock("@traduxo/packages/utils/history/fetchHistory", () => ({
  fetchHistory: jest.fn(),
}));

jest.mock("@traduxo/packages/contexts/LanguageContext", () => ({
  LanguageProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("react-toastify", () => ({
  ToastContainer: () => <div />,
}));

// ---- Helpers ----
const Providers = ({ children }: React.PropsWithChildren) => (
  <AppProviderBase>
    <TranslationProvider>{children}</TranslationProvider>
  </AppProviderBase>
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
    (useAuth as jest.Mock).mockReturnValue({
      status: "authenticated",
      token: "my-auth-token",
      providers: ["Credentials"],
      refresh: jest.fn(),
    });
  });

  // ------ Test 1️⃣ ------
  it("throws if used outside provider", () => {
    expect(() => renderHook(() => useTranslationContext())).toThrow(
      "useTranslationContext must be used inside a TranslationProvider"
    );
  });

  // ------ Test 2️⃣ ------
  it("provides state inside provider", () => {
    (useAuth as jest.Mock).mockReturnValue({
      status: "unauthenticated",
      token: undefined,
      providers: ["Credentials"],
      refresh: jest.fn(),
    });

    const { result } = renderHook(() => useTranslationContext(), { wrapper: Providers });
    act(() => {
      result.current.setInputText("hello");
    });
    expect(result.current.inputText).toBe("hello");
  });

  // ------ Test 3️⃣ ------
  it("calls saveTranslation when authenticated and saveToHistory is true", async () => {
    const mockHistory = { id: 1, inputText: "Hello", translation: "Hola" };
    const authToken = "my-auth-token";

    (useAuth as jest.Mock).mockReturnValue({
      status: "authenticated",
      token: authToken,
      providers: ["Credentials"],
      refresh: jest.fn(),
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockHistory }),
    }) as jest.Mock;

    const { result } = renderHook(() => useTranslationContext(), { wrapper: Providers });
    setTranslationData(result);

    act(() => {
      result.current.setSaveToHistory(true);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/history",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          }),
        })
      );
      expect(result.current.translationHistory).toContainEqual(mockHistory);
    });
  });

  // ------ Test 4️⃣ ------
  it("loadTranslationFromMenu sets state correctly when fromFavorite is false", () => {
    (useAuth as jest.Mock).mockReturnValue({
      status: "unauthenticated",
      token: undefined,
      providers: ["Credentials"],
      refresh: jest.fn(),
    });

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
    (useAuth as jest.Mock).mockReturnValue({
      status: "unauthenticated",
      token: undefined,
      providers: ["Credentials"],
      refresh: jest.fn(),
    });

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
      { type: "alternative", value: "" },
      { type: "alternative", value: "" },
      { type: "alternative", value: "" },
    ]);
    expect(result.current.inputTextLang).toBe("en");
    expect(result.current.translatedTextLang).toBe("fr");
  });

  // ------ Test 6️⃣ ------
  it("sets error when fetch returns !ok", async () => {
    const mockSetError = mockUseApp();
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

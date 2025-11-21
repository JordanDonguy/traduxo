/**
 * @jest-environment jsdom
 */
import { renderHook, act, waitFor } from "@testing-library/react";
import { useFavoriteTranslations } from "@traduxo/packages/hooks/favorites/useFavoriteTranslations";
import { useAuth } from "@traduxo/packages/contexts/AuthContext";
import { toast } from "react-toastify";

// ---- Mocks ----
const mockSetTranslationId = jest.fn();
const mockSetIsFavorite = jest.fn();
jest.mock("@traduxo/packages/contexts/TranslationContext", () => ({
  useTranslationContext: () => ({
    translationId: "1",
    setTranslationId: mockSetTranslationId,
    setIsFavorite: mockSetIsFavorite,
  }),
}));

// Mock useAuth
jest.mock("@traduxo/packages/contexts/AuthContext", () => ({
  useAuth: jest.fn(),
}));

// Mock Toast
jest.mock("react-toastify", () => ({
  toast: { error: jest.fn() },
}));


// ---- Tests ----
describe("useFavoriteTranslations", () => {
  let mockFetch: jest.Mock;

  beforeEach(() => {
    mockFetch = jest.fn();
    (useAuth as jest.Mock).mockReturnValue({
      status: "authenticated",
      token: "fake-jwt-token",
    });
  });

  // ------ Test 1️⃣ ------
  it("initializes with loading state", () => {
    const { result } = renderHook(() =>
      useFavoriteTranslations({ fetcher: mockFetch })
    );
    expect(result.current.isLoading).toBe(true);
    expect(result.current.favoriteTranslations).toEqual([]);
    expect(result.current.status).toBe("authenticated");
  });

  // ------ Test 2️⃣ ------
  it("fetches favorite translations successfully", async () => {
    const mockData = [{ id: "1", text: "Hello" }];
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    const { result } = renderHook(() =>
      useFavoriteTranslations({ fetcher: mockFetch })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "/favorite",
      { "headers": { "Authorization": "Bearer fake-jwt-token", "Content-Type": "application/json" } }
    );
    expect(result.current.favoriteTranslations).toEqual(mockData);
    expect(result.current.isLoading).toBe(false);
  });

  // ------ Test 3️⃣ ------
  it("handles 204 response (no favorites)", async () => {
    mockFetch.mockResolvedValue({ status: 204 });

    const { result } = renderHook(() =>
      useFavoriteTranslations({ fetcher: mockFetch })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });


    expect(result.current.favoriteTranslations).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  // ------ Test 4️⃣ ------
  it("handles fetch error gracefully", async () => {
    mockFetch.mockRejectedValue(new Error("network fail"));

    const { result } = renderHook(() =>
      useFavoriteTranslations({ fetcher: mockFetch })
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.favoriteTranslations).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  // ------ Test 5️⃣ ------
  it("deletes a translation successfully", async () => {
    const initialData = [
      { id: "1", inputText: "Hello", translation: "Bonjour", inputLang: "en", outputLang: "fr", alt1: "Salut", alt2: "Hey", alt3: "Bonsoir" },
      { id: "2", inputText: "Bye", translation: "Au revoir", inputLang: "en", outputLang: "fr", alt1: "Salut", alt2: "Bye", alt3: "À bientôt" },
    ];
    mockFetch.mockResolvedValue({ ok: true });

    const { result } = renderHook(() =>
      useFavoriteTranslations({ fetcher: mockFetch })
    );

    // Manually set initial translations
    act(() => result.current.favoriteTranslations.push(...initialData));

    await act(async () => {
      await result.current.deleteTranslation("1");
    });

    expect(result.current.favoriteTranslations).toEqual([
      { id: "2", inputText: "Bye", translation: "Au revoir", inputLang: "en", outputLang: "fr", alt1: "Salut", alt2: "Bye", alt3: "À bientôt" },
    ]);
  });

  // ------ Test 6️⃣ ------
  it("resets active translation if deleted", async () => {
    mockFetch.mockResolvedValue({ ok: true });

    const { result } = renderHook(() =>
      useFavoriteTranslations({ fetcher: mockFetch })
    );

    act(() => result.current.favoriteTranslations.push(
      { id: "1", inputText: "Hello", translation: "Bonjour", inputLang: "en", outputLang: "fr", alt1: "Salut", alt2: "Hey", alt3: "Bonsoir" },
    ));

    await act(async () => {
      await result.current.deleteTranslation("1");
    });

    expect(mockSetTranslationId).toHaveBeenCalledWith(undefined);
    expect(mockSetIsFavorite).toHaveBeenCalledWith(false);
    expect(result.current.favoriteTranslations).toEqual([]);
  });

  // ------ Test 7️⃣ ------
  it("does nothing when session status is loading", () => {
    (useAuth as jest.Mock).mockReturnValue({ status: "loading", token: undefined });

    const { result } = renderHook(() =>
      useFavoriteTranslations({ fetcher: mockFetch })
    );

    // useEffect should early return → isLoading stays true
    expect(result.current.isLoading).toBe(true);
  });

  // ------ Test 8️⃣ ------
  it("sets isLoading to false immediately when session is unauthenticated", async () => {
    (useAuth as jest.Mock).mockReturnValue({ status: "unauthenticated", token: undefined });

    const { result } = renderHook(() =>
      useFavoriteTranslations({ fetcher: mockFetch })
    );

    // Wait until hook effect runs
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Favorites list should remain empty
    expect(result.current.favoriteTranslations).toEqual([]);
  });

  // ------ Test 9️⃣ ------
  it("should return false immediately if no token is available", async () => {
    // Arrange: mock useAuth to return no token
    (useAuth as jest.Mock).mockReturnValue({
      status: "authenticated",
      token: null,
    });

    const { result } = renderHook(() =>
      useFavoriteTranslations({ fetcher: mockFetch })
    );

    // Act
    const res = await act(async () => result.current.deleteTranslation("1"));

    // Assert
    expect(res).toStrictEqual({
      message: "You need to be logged in to add a translation to favorites",
      success: false,
    });
    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockSetTranslationId).toHaveBeenCalledWith(undefined);
    expect(mockSetIsFavorite).toHaveBeenCalledWith(false);
  });
});

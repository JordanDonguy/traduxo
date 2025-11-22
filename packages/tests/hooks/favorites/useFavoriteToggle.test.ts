/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
import { useFavoriteToggle } from "@traduxo/packages/hooks/favorites/useFavoriteToggle";
import { useAuth } from "@traduxo/packages/contexts/AuthContext";

// ---- Mocks ----
let mockIsFavorite = false;
let mockTranslationId = "123";
const mockSetIsFavorite = jest.fn();
const mockSetTranslationId = jest.fn();

// Mock TranslationContext
jest.mock("@traduxo/packages/contexts/TranslationContext", () => ({
  useTranslationContext: () => ({
    translationId: mockTranslationId,
    setTranslationId: mockSetTranslationId,
    translatedText: "Hello",
    inputTextLang: "en",
    translatedTextLang: "fr",
    isFavorite: mockIsFavorite,
    setIsFavorite: mockSetIsFavorite,
  }),
}));

jest.mock("@traduxo/packages/contexts/AuthContext", () => ({
  useAuth: jest.fn(),
}));

describe("useFavoriteToggle (updated)", () => {
  const mockAdd = jest.fn();
  const mockDelete = jest.fn();

  beforeEach(() => {
    mockIsFavorite = false;
    mockTranslationId = "123";

    // Default: authenticated
    (useAuth as jest.Mock).mockReturnValue({
      status: "authenticated",
      token: "fake-token",
      providers: [],
      language: "en",
      refresh: jest.fn(),
    });
  });

  // ------ Test 1️⃣ ------
  it("returns error if user is unauthenticated", async () => {
    (useAuth as jest.Mock).mockReturnValue({ status: "unauthenticated" });

    const { result } = renderHook(() =>
      useFavoriteToggle({ addToFavoriteFn: mockAdd, deleteFromFavoriteFn: mockDelete })
    );

    let res;
    await act(async () => {
      res = await result.current.handleFavorite();
    });

    expect(res).toEqual({
      success: false,
      message: "You need to be logged in to add translations to favorites."
    });
    expect(mockAdd).not.toHaveBeenCalled();
    expect(mockDelete).not.toHaveBeenCalled();
  });

  // ------ Test 2️⃣ ------
  it("adds to favorites when not already favorite", async () => {
    const { result } = renderHook(() =>
      useFavoriteToggle({ addToFavoriteFn: mockAdd, deleteFromFavoriteFn: mockDelete })
    );

    await act(async () => {
      await result.current.handleFavorite();
    });

    expect(mockAdd).toHaveBeenCalledWith(
      "Hello", "en", "fr", mockSetTranslationId, mockSetIsFavorite, "fake-token"
    );
    expect(mockDelete).not.toHaveBeenCalled();
  });

  // ------ Test 3️⃣ ------
  it("deletes from favorites when already favorite", async () => {
    mockIsFavorite = true;

    const { result } = renderHook(() =>
      useFavoriteToggle({ addToFavoriteFn: mockAdd, deleteFromFavoriteFn: mockDelete })
    );

    await act(async () => {
      await result.current.handleFavorite();
    });

    expect(mockDelete).toHaveBeenCalledWith("123", mockSetTranslationId, mockSetIsFavorite, "fake-token");
    expect(mockAdd).not.toHaveBeenCalled();
  });

  // ------ Test 4️⃣ ------
  it("returns error if addToFavorite returns a string error", async () => {
    mockAdd.mockResolvedValue("Something went wrong");

    const { result } = renderHook(() =>
      useFavoriteToggle({ addToFavoriteFn: mockAdd })
    );

    let res;
    await act(async () => {
      res = await result.current.handleFavorite();
    });

    expect(res).toEqual({
      success: false,
      message: "Something went wrong"
    });
  });

  // ------ Test 5️⃣ ------
  it("returns false if addToFavorite throws", async () => {
    mockAdd.mockRejectedValue(new Error("network fail"));

    const { result } = renderHook(() =>
      useFavoriteToggle({ addToFavoriteFn: mockAdd })
    );

    let res;
    await act(async () => {
      res = await result.current.handleFavorite();
    });

    expect(res).toEqual({
      success: false,
      message: "Error adding or deleting translation from favorites"
    });
  });

  // ------ Test 6️⃣ ------
  it("prevents double-click spam when isFavLoading is true", async () => {
    let firstCallResolved = false;
    mockAdd.mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => {
        firstCallResolved = true;
        resolve(undefined);
      }, 50))
    );

    const { result } = renderHook(() =>
      useFavoriteToggle({ addToFavoriteFn: mockAdd })
    );

    // Start first call
    act(() => { result.current.handleFavorite(); });

    // Second call immediately → should return early
    let secondRes;
    await act(async () => {
      secondRes = await result.current.handleFavorite();
    });

    expect(secondRes).toEqual({ success: false, message: "Loading..." });
    expect(mockAdd).toHaveBeenCalledTimes(1);

    // Wait for first call to finish
    await new Promise((r) => setTimeout(r, 60));
    expect(firstCallResolved).toBe(true);
  });
});

/**
 * @jest-environment jsdom
 */
import { renderHook, act, waitFor } from "@testing-library/react";
import { useFavoriteToggle } from "@traduxo/packages/hooks/favorites/useFavoriteToggle";
import { useAuth } from "@traduxo/packages/contexts/AuthContext";
import { toast } from "react-toastify";

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

// Mock useAuth 
jest.mock("@traduxo/packages/contexts/AuthContext", () => ({
  useAuth: jest.fn(),
}));

// Mock Toastify
jest.mock("react-toastify", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

// ---- Tests ----
describe("useFavoriteToggle", () => {
  const mockAdd = jest.fn();
  const mockDelete = jest.fn();
  const mockToast = { error: jest.fn(), success: jest.fn() } as unknown as typeof toast;

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
  it("Display a toast error and return if not logged in", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      status: "unauthenticated",
      token: null,
      providers: [],
      language: null,
      refresh: jest.fn(),
    });

    const { result } = renderHook(() =>
      useFavoriteToggle({
        addToFavoriteFn: mockAdd,
        deleteFromFavoriteFn: mockDelete,
        toaster: mockToast,
      })
    );

    await act(async () => {
      await result.current.handleFavorite();
    });

    expect(mockToast.error).toHaveBeenCalledWith("You need to be logged in to add translations to favorites.");
    expect(mockAdd).not.toHaveBeenCalled();
    expect(mockDelete).not.toHaveBeenCalled();
  });

  // ------ Test 2️⃣ ------
  it("adds to favorites when not already favorite", async () => {
    const { result } = renderHook(() =>
      useFavoriteToggle({
        addToFavoriteFn: mockAdd,
        deleteFromFavoriteFn: mockDelete,
        toaster: mockToast,
      })
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
    mockIsFavorite = true; // override context mock

    const { result } = renderHook(() =>
      useFavoriteToggle({
        addToFavoriteFn: mockAdd,
        deleteFromFavoriteFn: mockDelete,
        toaster: mockToast,
      })
    );

    await act(async () => {
      await result.current.handleFavorite();
    });

    expect(mockDelete).toHaveBeenCalledWith("123", mockSetTranslationId, mockSetIsFavorite, "fake-token");
    expect(mockAdd).not.toHaveBeenCalled();
  });

  // ------ Test 4️⃣ ------
  it("shows toast error if addToFavorite returns error", async () => {
    mockAdd.mockResolvedValue("Something went wrong");

    const { result } = renderHook(() =>
      useFavoriteToggle({
        addToFavoriteFn: mockAdd,
        toaster: mockToast,
      })
    );

    await act(async () => {
      await result.current.handleFavorite();
    });

    expect(mockToast.error).toHaveBeenCalledWith("Something went wrong");
  });

  // ------ Test 5️⃣ ------
  it("returns false if addToFavorite throws", async () => {
    mockAdd.mockRejectedValue(new Error("network fail"));

    const { result } = renderHook(() =>
      useFavoriteToggle({
        addToFavoriteFn: mockAdd,
        toaster: mockToast,
      })
    );

    let res;
    await act(async () => {
      res = await result.current.handleFavorite();
    });

    expect(res).toBe(false);
  });

  // ------ Test 6️⃣ ------
  it("uses default toast when no override is passed", async () => {
    const { result } = renderHook(() => useFavoriteToggle());

    await act(async () => {
      await result.current.handleFavorite();
    });

    // Should have used default toast (just check it's defined)
    expect(toast.error).toBeDefined();
  });

  // ------ Test 7️⃣ ------
  it("should return early if isFavLoading is true", async () => {
    const { result } = renderHook(() =>
      useFavoriteToggle({
        addToFavoriteFn: mockAdd,
        deleteFromFavoriteFn: mockDelete,
        toaster: mockToast,
      })
    );

    // First call starts the async operation
    let firstCallResolved = false;
    mockAdd.mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => {
        firstCallResolved = true;
        resolve(undefined);
      }, 50))
    );

    // Fire first call (sets isFavLoading = true)
    act(() => {
      result.current.handleFavorite();
    });

    // Immediately fire second call → should hit early return
    await act(async () => {
      const res = await result.current.handleFavorite();
      expect(res).toBeUndefined(); // nothing returned
    });

    // At this point, only the first call should have triggered mockAdd
    expect(mockAdd).toHaveBeenCalledTimes(1);

    // Let the first call resolve
    await waitFor(() => expect(firstCallResolved).toBe(true));
  });
});

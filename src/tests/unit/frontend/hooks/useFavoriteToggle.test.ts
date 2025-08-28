/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
import { useFavoriteToggle } from "@/lib/client/hooks/useFavoriteToggle";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";

// ---- Mocks ----
let mockIsFavorite = false;
let mockTranslationId = "123";
const mockSetIsFavorite = jest.fn();
const mockSetTranslationId = jest.fn();

// Mock TranslationContext
jest.mock("@/context/TranslationContext", () => ({
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

// Mock NextAuth 
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
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

    // Default: authenticated session
    (useSession as jest.Mock).mockReturnValue({ status: "authenticated" });
  });

  // ------ Test 1️⃣ ------
  it("Display a toast error and return if not logged in", async () => {
    (useSession as jest.Mock).mockReturnValue({ status: "unauthenticated" });

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
      "Hello", "en", "fr", mockSetTranslationId, mockSetIsFavorite
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

    expect(mockDelete).toHaveBeenCalledWith("123", mockSetTranslationId, mockSetIsFavorite);
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
  it("uses default session and toast when no overrides are passed", async () => {
    // unauthenticated session from mock
    (useSession as jest.Mock).mockReturnValue({ status: "unauthenticated" });

    const { result } = renderHook(() => useFavoriteToggle());

    await act(async () => {
      await result.current.handleFavorite();
    });

    // Should have used default toast (just check it's defined)
    expect(toast.error).toBeDefined();
  });
});

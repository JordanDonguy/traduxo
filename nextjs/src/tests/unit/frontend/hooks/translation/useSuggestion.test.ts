/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
import { useSuggestion } from "@/lib/client/hooks/translation/useSuggestion";
import { useTranslationContext } from "@/context/TranslationContext";
import { useAuth } from "@traduxo/packages/contexts/AuthContext";
import * as nextNavigation from "next/navigation";

// ---- Mock helpers ----
const mockSetIsLoading = jest.fn();
const mockSetError = jest.fn();
const mockSetInputText = jest.fn();
const mockSetTranslatedText = jest.fn();
const mockSetInputTextLang = jest.fn();
const mockSetTranslatedTextLang = jest.fn();
const mockSetExplanation = jest.fn();
const mockSetIsFavorite = jest.fn();
const mockSetTranslationId = jest.fn();
const mockSetExpressionPool = jest.fn();
const mockSetSaveToHistory = jest.fn();

// ---- Mocks ----
jest.mock("@/context/AppContext", () => ({
  useApp: () => ({ setIsLoading: mockSetIsLoading, setError: mockSetError }),
}));

jest.mock("@/context/TranslationContext", () => ({
  useTranslationContext: () => ({
    setInputText: mockSetInputText,
    setTranslatedText: mockSetTranslatedText,
    setInputTextLang: mockSetInputTextLang,
    setTranslatedTextLang: mockSetTranslatedTextLang,
    setExplanation: mockSetExplanation,
    setIsFavorite: mockSetIsFavorite,
    setTranslationId: mockSetTranslationId,
    expressionPool: [],
    setExpressionPool: mockSetExpressionPool,
    translationHistory: [],
  }),
}));

jest.mock("@/context/LanguageContext", () => ({
  useLanguageContext: () => ({
    outputLang: "fr",
    detectedLang: "en",
  }),
}));

jest.mock("@traduxo/packages/contexts/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock("@/lib/client/hooks/auth/useWaitForAuthStatus", () => ({
  useWaitForAuthStatus: () => ({ waitForStatus: jest.fn().mockResolvedValue(undefined) }),
}));

// Mock utils
const mockTranslationHelper = jest.fn().mockResolvedValue(undefined);
const mockSuggestExpressionHelper = jest.fn().mockResolvedValue(undefined);
const mockFetchExpressionPoolHelper = jest.fn().mockResolvedValue(undefined);
const mockGetSuggestionLanguage = jest.fn(() => "en");


// ---- Tests ----
describe("useSuggestion", () => {
  let mockRouter: ReturnType<typeof nextNavigation.useRouter>;

  beforeAll(() => jest.useFakeTimers());
  afterAll(() => jest.useRealTimers());
  beforeEach(() => {
    mockRouter = { push: jest.fn() } as unknown as ReturnType<typeof nextNavigation.useRouter>;
    (useAuth as jest.Mock).mockReturnValue({
      status: "authenticated",
      token: "fake-token",
      providers: [],
      language: "en",
      refresh: jest.fn(),
    });
  });

  // ------ Test 1️⃣ ------
  it("toggles isRolling and calls router.push", async () => {
    const { result } = renderHook(() =>
      useSuggestion({
        router: mockRouter,
        translationHelperFn: mockTranslationHelper,
        suggestExpressionHelperFn: mockSuggestExpressionHelper,
        fetchExpressionPoolHelperFn: mockFetchExpressionPoolHelper,
        getSuggestionLanguageFn: mockGetSuggestionLanguage,
      })
    );

    act(() => {
      result.current.suggestTranslation();
    });

    // Immediately after calling
    expect(result.current.isRolling).toBe(true);
    expect(mockRouter.push).toHaveBeenCalledWith("/");

    // Fast-forward timeout
    act(() => jest.advanceTimersByTime(600));
    expect(result.current.isRolling).toBe(false);
  });

  // ------ Test 2️⃣ ------
  it("calls suggestExpressionHelper when pool is empty", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      status: "unauthenticated",
      token: undefined,
      providers: [],
      language: undefined,
      refresh: jest.fn(),
    });

    const { result } = renderHook(() =>
      useSuggestion({
        translationHelperFn: mockTranslationHelper,
        suggestExpressionHelperFn: mockSuggestExpressionHelper,
        fetchExpressionPoolHelperFn: mockFetchExpressionPoolHelper,
        getSuggestionLanguageFn: mockGetSuggestionLanguage,
      })
    );

    await act(async () => {
      await result.current.suggestTranslation();
    });

    expect(mockSuggestExpressionHelper).toHaveBeenCalled();
    expect(mockFetchExpressionPoolHelper).not.toHaveBeenCalled(); // unauthenticated
    expect(mockTranslationHelper).not.toHaveBeenCalled();
  });

  // ------ Test 3️⃣ ------
  it("fetches expression pool when authenticated", async () => {
    const translationContextMock: ReturnType<typeof useTranslationContext> = {
      inputText: "",
      translatedText: [],
      inputTextLang: "en",
      translatedTextLang: "fr",
      explanation: "",
      isFavorite: false,
      translationId: undefined,
      expressionPool: [], // empty to trigger fetch
      translationHistory: [],
      saveToHistory: false,
      loadTranslationFromMenu: jest.fn(),
      setTranslationHistory: jest.fn(),
      setInputText: mockSetInputText,
      setTranslatedText: mockSetTranslatedText,
      setInputTextLang: mockSetInputTextLang,
      setTranslatedTextLang: mockSetTranslatedTextLang,
      setExplanation: mockSetExplanation,
      setIsFavorite: mockSetIsFavorite,
      setTranslationId: mockSetTranslationId,
      setExpressionPool: mockSetExpressionPool,
      setSaveToHistory: mockSetSaveToHistory,
    };

    const { result } = renderHook(() =>
      useSuggestion({
        translationContext: translationContextMock,
        translationHelperFn: mockTranslationHelper,
        suggestExpressionHelperFn: mockSuggestExpressionHelper,
        fetchExpressionPoolHelperFn: mockFetchExpressionPoolHelper,
        getSuggestionLanguageFn: mockGetSuggestionLanguage,
      })
    );

    await act(async () => {
      await result.current.suggestTranslation();
    });

    // Assertions
    expect(mockFetchExpressionPoolHelper).toHaveBeenCalledWith(
      expect.objectContaining({
        setExpressionPool: mockSetExpressionPool,
        setError: mockSetError,
        suggestionLang: "en",
      })
    );

    expect(mockSuggestExpressionHelper).toHaveBeenCalled();
  });

  // ------ Test 4️⃣ ------
  it("calls translationHelper when pool has an unused expression", async () => {
    // Properly typed translation context
    const translationContextMock: ReturnType<typeof useTranslationContext> = {
      inputText: "",
      translatedText: [],
      inputTextLang: "en",
      translatedTextLang: "fr",
      explanation: "",
      isFavorite: false,
      translationId: undefined,
      expressionPool: ["foo"],
      translationHistory: [],
      saveToHistory: false,
      setInputText: mockSetInputText,
      setTranslatedText: mockSetTranslatedText,
      setInputTextLang: mockSetInputTextLang,
      setTranslatedTextLang: mockSetTranslatedTextLang,
      setExplanation: mockSetExplanation,
      setIsFavorite: mockSetIsFavorite,
      setTranslationId: mockSetTranslationId,
      setExpressionPool: mockSetExpressionPool,
      loadTranslationFromMenu: jest.fn(),
      setTranslationHistory: jest.fn(),
      setSaveToHistory: mockSetSaveToHistory,
    };

    const { result } = renderHook(() =>
      useSuggestion({
        translationContext: translationContextMock,
        translationHelperFn: mockTranslationHelper,
        suggestExpressionHelperFn: mockSuggestExpressionHelper,
        fetchExpressionPoolHelperFn: mockFetchExpressionPoolHelper,
        getSuggestionLanguageFn: mockGetSuggestionLanguage,
      })
    );

    await act(async () => {
      await result.current.suggestTranslation();
    });

    expect(mockTranslationHelper).toHaveBeenCalledWith(
      expect.objectContaining({ inputText: "foo" })
    );
    expect(mockSetExpressionPool).toHaveBeenCalled();
  });

  // ------ Test 5️⃣ ------
  it("resets the pool and calls suggestExpressionHelper when all expressions are used", async () => {
    const translationContextMock: ReturnType<typeof useTranslationContext> = {
      // ---- State values (just dummy values for testing) ----
      inputText: "",
      translatedText: [],
      inputTextLang: "en",
      translatedTextLang: "fr",
      explanation: "",
      isFavorite: false,
      translationId: undefined,
      expressionPool: ["Hello", "Bye"], // initial pool
      translationHistory: [
        { id: "1", inputText: "Hello", translation: "Bonjour", inputLang: "en", outputLang: "fr", alt1: "Salut", alt2: "Hey", alt3: "Bonsoir" },
        { id: "2", inputText: "Bye", translation: "Au revoir", inputLang: "en", outputLang: "fr", alt1: "Salut", alt2: "Bye", alt3: "À bientôt" }
      ], // Same elements as in expressionPool (inputText)
      saveToHistory: false,

      // ---- Required functions ----
      loadTranslationFromMenu: jest.fn(),
      setTranslationHistory: jest.fn(),

      // ---- Setters ----
      setInputText: mockSetInputText,
      setTranslatedText: mockSetTranslatedText,
      setInputTextLang: mockSetInputTextLang,
      setTranslatedTextLang: mockSetTranslatedTextLang,
      setExplanation: mockSetExplanation,
      setIsFavorite: mockSetIsFavorite,
      setTranslationId: mockSetTranslationId,
      setExpressionPool: mockSetExpressionPool,
      setSaveToHistory: mockSetSaveToHistory,
    };

    const { result } = renderHook(() =>
      useSuggestion({
        translationContext: translationContextMock,
        translationHelperFn: mockTranslationHelper,
        suggestExpressionHelperFn: mockSuggestExpressionHelper,
        fetchExpressionPoolHelperFn: mockFetchExpressionPoolHelper,
        getSuggestionLanguageFn: mockGetSuggestionLanguage,
      })
    );

    // Call the hook
    await act(async () => {
      await result.current.suggestTranslation();
    });

    // ---- Assertions ----
    // Pool should be cleared once since all expressions were used
    expect(mockSetExpressionPool).toHaveBeenCalledWith([]);

    // Suggestion helper should be called after pool reset
    expect(mockSuggestExpressionHelper).toHaveBeenCalled();

    // Translation helper should not be called (no new expression from old pool)
    expect(mockTranslationHelper).not.toHaveBeenCalled();

    // Pool fetch helper should be called
    expect(mockFetchExpressionPoolHelper).toHaveBeenCalled();
  });

  // ------ Test 6️⃣ ------
  it("handles waitForStatus rejection gracefully", async () => {
    const { result } = renderHook(() =>
      useSuggestion({
        waitForAuthStatus: {
          waitForStatus: jest.fn().mockRejectedValue(new Error("fail")),
          ready: false,
          status: "unauthenticated"
        },
        translationHelperFn: mockTranslationHelper,
        suggestExpressionHelperFn: mockSuggestExpressionHelper,
        fetchExpressionPoolHelperFn: mockFetchExpressionPoolHelper,
        getSuggestionLanguageFn: mockGetSuggestionLanguage,
      })
    );

    await act(async () => {
      await result.current.suggestTranslation();
    });

    // Check that error message has been set and loading has been stopped
    expect(mockSetError).toHaveBeenCalledWith("Oops! An unexpected error occured... Please try again 🙏");
    expect(mockSetIsLoading).toHaveBeenLastCalledWith(false);
  });
});

// Note: Remaining uncovered functions/branches are inside mocked helpers (translationHelper, loadTranslationFromMenu); all key paths in useSuggestion are tested.

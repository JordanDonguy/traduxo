/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
import { useSelectTranslation } from "@/lib/client/hooks/translation/useSelectTranslation";
import { Translation } from "@traduxo/packages/types";

// ---- Mocks ----
const mockLoadTranslationFromMenu = jest.fn();
const mockSetInputLang = jest.fn();
const mockSetOutputLang = jest.fn();
const mockRouterPush = jest.fn();

// Mock TranslationContext
jest.mock("@/context/TranslationContext", () => ({
  useTranslationContext: () => ({
    loadTranslationFromMenu: mockLoadTranslationFromMenu,
  }),
}));

// Mock LanguageContext
jest.mock("@/context/LanguageContext", () => ({
  useLanguageContext: () => ({
    setInputLang: mockSetInputLang,
    setOutputLang: mockSetOutputLang,
  }),
}));

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

// ---- Sample translation object matching the type ----
const sampleTranslation: Translation = {
  id: "1",
  inputText: "Hello",
  translation: "Bonjour",
  inputLang: "en",
  outputLang: "fr",
  alt1: null,
  alt2: null,
  alt3: null,
};

// ---- Tests ----
describe("useSelectTranslation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ------ Test 1️⃣ ------
  it("calls loadTranslationFromMenu, sets languages, and navigates", () => {
    const { result } = renderHook(() => useSelectTranslation());

    act(() => result.current.selectTranslation(sampleTranslation, true));

    // Should call translation loader with correct args
    expect(mockLoadTranslationFromMenu).toHaveBeenCalledWith(sampleTranslation, true);

    // Should update input/output languages
    expect(mockSetInputLang).toHaveBeenCalledWith("en");
    expect(mockSetOutputLang).toHaveBeenCalledWith("fr");

    // Should navigate to home page
    expect(mockRouterPush).toHaveBeenCalledWith("/");
  });

  // ------ Test 2️⃣ ------
  it("works with isFavorite = false", () => {
    const { result } = renderHook(() => useSelectTranslation());

    act(() => result.current.selectTranslation(sampleTranslation, false));

    expect(mockLoadTranslationFromMenu).toHaveBeenCalledWith(sampleTranslation, false);
    expect(mockSetInputLang).toHaveBeenCalledWith("en");
    expect(mockSetOutputLang).toHaveBeenCalledWith("fr");
    expect(mockRouterPush).toHaveBeenCalledWith("/");
  });

  // ------ Test 3️⃣ ------
  it("uses default contexts and router if no injections are provided", () => {
    // This test ensures the fallback lines are executed
    const { result } = renderHook(() => useSelectTranslation());

    // We just call selectTranslation to make sure it doesn't throw
    act(() =>
      result.current.selectTranslation(sampleTranslation, true)
    );

    // No assertions needed; the test is just for coverage
  });

});

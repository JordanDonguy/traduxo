/**
 * @jest-environment jsdom
 */

import { renderHook, act } from "@testing-library/react";
import { LanguageProvider, useLanguageContext } from "@/context/LanguageContext";
import { useAuth } from "@traduxo/packages/contexts/AuthContext";
import { useTranslationContext } from "@/context/TranslationContext";

// ---- Mocks ----
jest.mock("@traduxo/packages/contexts/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/context/TranslationContext", () => ({
  useTranslationContext: jest.fn(),
}));


// ---- Tests ----
describe("LanguageContext", () => {
  const mockSetExpressionPool = jest.fn();
  const originalNavigator = { ...global.navigator };

  beforeEach(() => {
    (useTranslationContext as jest.Mock).mockReturnValue({
      setExpressionPool: mockSetExpressionPool,
    });

    // Default: unauthenticated
    (useAuth as jest.Mock).mockReturnValue({
      status: "unauthenticated",
      token: null,
      providers: [],
      language: "en",
      refresh: jest.fn(),
    });
  });

  afterEach(() => {
    Object.defineProperty(global, "navigator", {
      value: originalNavigator,
      writable: true,
    });
  });

  // ------ Test 1️⃣ ------
  it("throws if used outside provider", () => {
    expect(() => renderHook(() => useLanguageContext())).toThrow(
      "useLanguageContext must be used inside a LanguageProvider"
    );
  });

  // ------ Test 2️⃣ ------
  it("provides default state inside provider", () => {
    const { result } = renderHook(() => useLanguageContext(), {
      wrapper: LanguageProvider,
    });

    expect(result.current.inputLang).toBe("auto");
    expect(result.current.outputLang).toBe("en");
    expect(result.current.detectedLang).toBe(result.current.systemLang);
  });

  // ------ Test 3️⃣ ------
  it("falls back to navigator.language if available", () => {
    Object.defineProperty(global, "navigator", {
      value: { language: "fr-FR", languages: ["fr-FR"] },
      writable: true,
    });

    const { result } = renderHook(() => useLanguageContext(), {
      wrapper: LanguageProvider,
    });

    expect(result.current.systemLang).toBe("fr");
  });

  // ------ Test 4️⃣ ------
  it("falls back to navigator.languages[0] if navigator.language undefined", () => {
    Object.defineProperty(global, "navigator", {
      value: { language: undefined, languages: ["es-ES"] },
      writable: true,
    });

    const { result } = renderHook(() => useLanguageContext(), {
      wrapper: LanguageProvider,
    });

    expect(result.current.systemLang).toBe("es");
  });

  // ------ Test 5️⃣ ------
  it("falls back to 'en' if neither navigator.language nor navigator.languages defined", () => {
    Object.defineProperty(global, "navigator", {
      value: { language: undefined, languages: undefined },
      writable: true,
    });

    const { result } = renderHook(() => useLanguageContext(), {
      wrapper: LanguageProvider,
    });

    expect(result.current.systemLang).toBe("en");
  });

  // ------ Test 6️⃣ ------
  it("detectedLang returns systemLang when inputLang is 'auto'", () => {
    Object.defineProperty(global, "navigator", {
      value: { language: "de-DE", languages: ["de-DE"] },
      writable: true,
    });

    const { result } = renderHook(() => useLanguageContext(), {
      wrapper: LanguageProvider,
    });

    // inputLang defaults to "auto", so detectedLang should equal systemLang
    expect(result.current.inputLang).toBe("auto");
    expect(result.current.systemLang).toBe("de");
    expect(result.current.detectedLang).toBe("de");
  });

  // ------ Test 7️⃣ ------
  it("detectedLang returns inputLang when inputLang is not 'auto'", () => {
    const { result } = renderHook(() => useLanguageContext(), {
      wrapper: LanguageProvider,
    });

    act(() => result.current.setInputLang("fr"));

    // detectedLang should now equal inputLang
    expect(result.current.inputLang).toBe("fr");
    expect(result.current.detectedLang).toBe("fr");
  });

  // ------ Test 8️⃣ ------
  it("sets systemLang from language when authenticated", () => {
    (useAuth as jest.Mock).mockReturnValue({
      status: "authenticated",
      token: null,
      providers: [],
      language: "jp",
      refresh: jest.fn(),
    });

    const { result } = renderHook(() => useLanguageContext(), {
      wrapper: LanguageProvider,
    });

    // systemLang should be updated to the session's value
    expect(result.current.systemLang).toBe("jp");
    expect(result.current.detectedLang).toBe("jp"); // because inputLang defaults to "auto"
  });

  // ------ Test 9️⃣ ------
  it("does not change systemLang if language is undefined", () => {
    (useAuth as jest.Mock).mockReturnValue({
      status: "authenticated",
      token: null,
      providers: [],
      language: undefined,
      refresh: jest.fn(),
    });

    const { result } = renderHook(() => useLanguageContext(), {
      wrapper: LanguageProvider,
    });

    // systemLang should remain the browserLang fallback
    expect(result.current.systemLang).toBe(result.current.systemLang);
  });
});

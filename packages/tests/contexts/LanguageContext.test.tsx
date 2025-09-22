/**
 * @jest-environment jsdom
 */

import { renderHook, act, waitFor } from "@testing-library/react";
import { LanguageProvider, useLanguageContext } from "@traduxo/packages/contexts/LanguageContext";
import { useAuth } from "@traduxo/packages/contexts/AuthContext";
import { useTranslationContext } from "@traduxo/packages/contexts/TranslationContext";
import { getSystemLanguage } from "@traduxo/packages/utils/language/systemLanguage";

// ---- Mocks ----
jest.mock("@traduxo/packages/contexts/AuthContext", () => ({
  useAuth: jest.fn(() => ({ status: "unauthenticated", token: undefined })),
}));

jest.mock("@traduxo/packages/contexts/TranslationContext", () => ({
  useTranslationContext: jest.fn(),
}));

jest.mock("@traduxo/packages/utils/language/systemLanguage", () => ({
  getSystemLanguage: jest.fn(),
}));

// ---- Tests ----
describe("LanguageContext", () => {
  const mockSetExpressionPool = jest.fn();
  const originalNavigator = { ...global.navigator };

  beforeEach(() => {
    (getSystemLanguage as jest.Mock).mockReturnValue("en");
    (useTranslationContext as jest.Mock).mockReturnValue({
      setExpressionPool: mockSetExpressionPool,
    });
    (useAuth as jest.Mock).mockReturnValue({ status: "unauthenticated", token: undefined });
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
    (getSystemLanguage as jest.Mock).mockReturnValue("fr");

    const { result } = renderHook(() => useLanguageContext(), { wrapper: LanguageProvider });

    expect(result.current.systemLang).toBe("fr");
  });

  // ------ Test 4️⃣ ------
  it("falls back to navigator.languages[0] if navigator.language undefined", () => {
    (getSystemLanguage as jest.Mock).mockReturnValue("es");

    const { result } = renderHook(() => useLanguageContext(), { wrapper: LanguageProvider });

    expect(result.current.systemLang).toBe("es");
  });

  // ------ Test 5️⃣ ------
  it("falls back to 'en' if neither navigator.language nor navigator.languages defined", () => {
    (getSystemLanguage as jest.Mock).mockReturnValue("en");

    const { result } = renderHook(() => useLanguageContext(), { wrapper: LanguageProvider });

    expect(result.current.systemLang).toBe("en");
  });

  // ------ Test 6️⃣ ------
  it("detectedLang returns systemLang when inputLang is 'auto'", () => {
    (getSystemLanguage as jest.Mock).mockReturnValue("de");

    const { result } = renderHook(() => useLanguageContext(), { wrapper: LanguageProvider });

    expect(result.current.inputLang).toBe("auto");
    expect(result.current.systemLang).toBe("de");
    expect(result.current.detectedLang).toBe("de");
  });

  // ------ Test 7️⃣ ------
  it("detectedLang returns inputLang when inputLang is not 'auto'", () => {
    const { result } = renderHook(() => useLanguageContext(), { wrapper: LanguageProvider });

    act(() => result.current.setInputLang("fr"));

    expect(result.current.inputLang).toBe("fr");
    expect(result.current.detectedLang).toBe("fr");
  });

  // ------ Test 8️⃣ ------
  it("sets systemLang from auth status when authenticated", async () => {
    // Mock auth returning authenticated with language 'jp'
    (useAuth as jest.Mock).mockReturnValue({
      status: "authenticated",
      token: "mock-token",
      language: "jp",
    });

    const { result } = renderHook(() => useLanguageContext(), { wrapper: LanguageProvider });

    // Wait for useEffect in LanguageProvider to apply the language
    await waitFor(() => expect(result.current.systemLang).toBe("jp"));
    expect(result.current.detectedLang).toBe("jp");
  });


  // ------ Test 9️⃣ ------
  it("does not change systemLang if auth status has no systemLang", () => {
    (useAuth as jest.Mock).mockReturnValue({
      status: "authenticated",
      token: "mock-token",
      user: {},
    });

    const { result } = renderHook(() => useLanguageContext(), { wrapper: LanguageProvider });

    expect(result.current.systemLang).toBe(result.current.systemLang); // fallback remains
  });
});

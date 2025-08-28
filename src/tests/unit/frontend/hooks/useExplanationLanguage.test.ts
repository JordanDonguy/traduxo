/**
 * @jest-environment jsdom
 */

import { renderHook, act } from "@testing-library/react";
import { useExplanationLanguage } from "@/lib/client/hooks/useExplanationLanguage";
import { useSession } from "next-auth/react";

// ---- Mocks ----
let mockSystemLang = "en";
const mockSetSystemLang = jest.fn((code: string) => { mockSystemLang = code; });

jest.mock("@/context/LanguageContext", () => ({
  useLanguageContext: () => ({
    systemLang: mockSystemLang,
    setSystemLang: mockSetSystemLang,
  }),
}));

jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
}));

// Session mock
const mockSession = (authenticated: boolean) => {
  (useSession as jest.Mock).mockReturnValue(
    authenticated
      ? { status: "authenticated", data: { user: { name: "Test" }, expires: "" }, update: jest.fn() }
      : { status: "unauthenticated", data: null, update: jest.fn() }
  );
};

// ---- Tests ----
describe("useExplanationLanguage", () => {
  let mockFetcher: jest.Mock;

  beforeEach(() => {
    mockFetcher = jest.fn();
    mockSystemLang = "en";
  });

  // ------ Test 1️⃣ ------
  it("returns current system language", () => {
    mockSession(true); // inject authenticated session
    const { result } = renderHook(() =>
      useExplanationLanguage({ fetcher: mockFetcher })
    );
    expect(result.current.systemLang).toBe("en");
  });

  // ------ Test 2️⃣ ------
  it("updates local state immediately when changing language", async () => {
    // Test that setSystemLang updates state even if API call is not made
    const { result } = renderHook(() =>
      useExplanationLanguage({ fetcher: mockFetcher })
    );

    await act(async () => {
      const success = await result.current.changeSystemLang("fr");
      expect(success).toBe(true);
    });

    expect(mockSetSystemLang).toHaveBeenCalledWith("fr");
    expect(mockSystemLang).toBe("fr");
  });

  // ------ Test 3️⃣ ------ 
  it("calls API when session is authenticated", async () => {
    mockSession(true); // inject authenticated session

    mockFetcher.mockResolvedValue({ ok: true }); // mock successful API response

    const { result } = renderHook(() =>
      useExplanationLanguage({ fetcher: mockFetcher })
    );

    await act(async () => {
      const success = await result.current.changeSystemLang("fr");
      expect(success).toBe(true);
    });

    // Ensure both local state and API call occurred
    expect(mockSetSystemLang).toHaveBeenCalledWith("fr");
    expect(mockFetcher).toHaveBeenCalledWith(
      "/api/auth/update-language",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "fr" }),
      })
    );
  });

  // ------ Test 4️⃣ ------
  it("does not call API when session is unauthenticated", async () => {
    mockSession(false);  // inject unauthenticated session

    const { result } = renderHook(() =>
      useExplanationLanguage({ fetcher: mockFetcher })
    );

    await act(async () => {
      const success = await result.current.changeSystemLang("es");
      expect(success).toBe(true);
    });

    // Only local state should update; no API call
    expect(mockSetSystemLang).toHaveBeenCalledWith("es");
    expect(mockFetcher).not.toHaveBeenCalled();
  });

  // ------ Test 5️⃣ ------
  it("returns false on fetch error when session is authenticated", async () => {
    mockSession(true); // inject authenticated session

    // Simulate network failure
    mockFetcher.mockRejectedValue(new Error("network fail"));

    const { result } = renderHook(() =>
      useExplanationLanguage({ fetcher: mockFetcher })
    );

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.changeSystemLang("de");
    });

    // Verify failure is propagated and local state still updates
    expect(success).toBe(false);
    expect(mockSetSystemLang).toHaveBeenCalledWith("de");
  });
});

// Note: Branch coverage limited due to external next-auth hooks; tested key flows only

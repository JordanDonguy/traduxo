/**
 * @jest-environment jsdom
 */

import { renderHook, act } from "@testing-library/react";
import { useExplanationLanguage } from "@traduxo/packages/hooks/explanation/useExplanationLanguage";
import { useAuth } from "@traduxo/packages/contexts/AuthContext";

// ---- Mocks ----
let mockSystemLang = "en";
const mockSetSystemLang = jest.fn((code: string) => { mockSystemLang = code; });

jest.mock("@traduxo/packages/contexts/LanguageContext", () => ({
  useLanguageContext: () => ({
    systemLang: mockSystemLang,
    setSystemLang: mockSetSystemLang,
  }),
}));

jest.mock("@traduxo/packages/contexts/AuthContext", () => ({
  useAuth: jest.fn(),
}));

// Session mock
const mockAuth = (authenticated: boolean) => {
  (useAuth as jest.Mock).mockReturnValue(
    authenticated
      ? { status: "authenticated", token: "fake-token", providers: [], language: "en", refresh: jest.fn() }
      : { status: "unauthenticated", token: null, providers: [], language: null, refresh: jest.fn() }
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
    mockAuth(true); // inject authenticated session
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
    mockAuth(true); // inject authenticated session

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
      "/auth/update-language",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Authorization": "Bearer fake-token",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ code: "fr" }),
      })
    );
  });

  // ------ Test 4️⃣ ------
  it("does not call API when session is unauthenticated", async () => {
    mockAuth(false);  // inject unauthenticated session

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
    mockAuth(true); // inject authenticated session

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

  // ------ Test 6️⃣ ------
  it("returns false if session is authenticated but token is missing", async () => {
    // Authenticated session but no token
    (useAuth as jest.Mock).mockReturnValue({
      status: "authenticated",
      token: null,
      providers: [],
      language: "en",
      refresh: jest.fn(),
    });

    const { result } = renderHook(() =>
      useExplanationLanguage({ fetcher: mockFetcher })
    );

    let success: boolean | undefined;
    await act(async () => {
      success = await result.current.changeSystemLang("it");
    });

    // Should return false and skip API call
    expect(success).toBe(false);
    expect(mockSetSystemLang).toHaveBeenCalledWith("it"); // local update still happens
    expect(mockFetcher).not.toHaveBeenCalled();           // no API call without token
  });
});

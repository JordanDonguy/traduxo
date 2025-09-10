/**
 * @jest-environment jsdom
 */

import { renderHook, waitFor } from "@testing-library/react";
import { useGoogleCallback } from "@packages/hooks/auth/useGoogleCallback";
import * as authUtils from "@traduxo/packages/utils/auth";

// ---- Mocks ----
const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockGet = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush }),
  useSearchParams: () => ({
    get: mockGet,
  }),
}));

// Mock saveToken
jest.spyOn(authUtils, "saveToken").mockImplementation(jest.fn());

// ---- Tests ----
describe("useGoogleCallback", () => {
  // ------ Test 1️⃣ ------
  it("does nothing if code param is missing", () => {
    const mockFetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({}),
    });
    mockGet.mockReturnValue(null);
    renderHook(() => useGoogleCallback({ fetchFn: mockFetch }));
    expect(mockReplace).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  // ------ Test 2️⃣ ------
  it("redirects to linking page if backend returns NeedGoogleLinking", async () => {
    mockGet.mockReturnValue("some-code");
    const mockFetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({ error: "NeedGoogleLinking" }),
    });

    renderHook(() => useGoogleCallback({ fetchFn: mockFetch }));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/auth/google/link-account");
    });
  });

  // ------ Test 3️⃣ ------
  it("saves token and redirects on successful login", async () => {
    mockGet.mockReturnValue("some-code");
    const mockFetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({ accessToken: "at", refreshToken: "rt" }),
    });

    renderHook(() => useGoogleCallback({ fetchFn: mockFetch }));

    await waitFor(() => {
      expect(authUtils.saveToken).toHaveBeenCalledWith("at", "rt");
      expect(mockReplace).toHaveBeenCalledWith("/?login=true");
    });
  });

  // ------ Test 4️⃣ ------
  it("redirects to error page if backend fails without tokens", async () => {
    mockGet.mockReturnValue("some-code");
    const mockFetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({}),
    });

    renderHook(() => useGoogleCallback({ fetchFn: mockFetch }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/?error=google-auth");
    });
  });

  // ------ Test 5️⃣ ------
  it("redirects to server error page on fetch failure", async () => {
    mockGet.mockReturnValue("some-code");
    const mockFetch = jest.fn().mockRejectedValue(new Error("fail"));

    renderHook(() => useGoogleCallback({ fetchFn: mockFetch }));
    await Promise.resolve();

    expect(mockPush).toHaveBeenCalledWith("/?error=server");
  });
});

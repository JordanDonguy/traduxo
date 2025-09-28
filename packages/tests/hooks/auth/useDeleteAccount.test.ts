/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
import { useDeleteAccount } from "@traduxo/packages/hooks/auth/useDeleteAccount";
import { API_BASE_URL } from "@traduxo/packages/utils/config/apiBase";

// ---- Mocks ----
const mockGetToken = jest.fn();
const mockLogoutUser = jest.fn();
const mockClearToken = jest.fn();

jest.mock("@traduxo/packages/utils/auth/token", () => ({
  getToken: (...args: any[]) => mockGetToken(...args),
  clearToken: (...args: any[]) => mockClearToken(...args),
}));

jest.mock("@traduxo/packages/utils/auth/logout", () => ({
  logoutUser: (...args: any[]) => mockLogoutUser(...args),
}));

describe("useDeleteAccount", () => {
  let mockFetcher: jest.Mock;
  let onSuccess: jest.Mock;
  let onError: jest.Mock;

  beforeEach(() => {
    mockFetcher = jest.fn();
    onSuccess = jest.fn();
    onError = jest.fn();
    jest.clearAllMocks();
  });

  // ------ Test 1️⃣ ------
  it("fails if tokens are missing", async () => {
    mockGetToken.mockResolvedValue(null);

    const { result } = renderHook(() =>
      useDeleteAccount({ fetcher: mockFetcher, onError })
    );

    await act(async () => {
      const success = await result.current.deleteAccount();
      expect(success).toBe(false);
    });

    expect(onError).toHaveBeenCalledWith("Missing authentication tokens");
    expect(mockFetcher).not.toHaveBeenCalled();
  });

  // ------ Test 2️⃣ ------
  it("handles API returning not-ok", async () => {
    mockGetToken.mockResolvedValue({ token: "t1", refreshToken: "r1" });
    mockFetcher.mockResolvedValue({ ok: false });

    const { result } = renderHook(() =>
      useDeleteAccount({ fetcher: mockFetcher, onError })
    );

    await act(async () => {
      const success = await result.current.deleteAccount();
      expect(success).toBe(false);
    });

    expect(onError).toHaveBeenCalledWith("Failed to delete account");
    expect(mockLogoutUser).not.toHaveBeenCalled();
  });

  // ------ Test 3️⃣ ------
  it("handles logout failure after successful account deletion", async () => {
    mockGetToken.mockResolvedValue({ token: "t1", refreshToken: "r1" });
    mockFetcher.mockResolvedValue({ ok: true });
    mockLogoutUser.mockResolvedValue(false);

    const { result } = renderHook(() =>
      useDeleteAccount({ fetcher: mockFetcher, onError })
    );

    await act(async () => {
      const success = await result.current.deleteAccount();
      expect(success).toBe(false);
    });

    expect(mockFetcher).toHaveBeenCalledWith(`${API_BASE_URL}/auth/delete-account`, expect.any(Object));
    expect(mockLogoutUser).toHaveBeenCalledWith("t1", "r1");
    expect(onError).toHaveBeenCalledWith(
      "Account deleted but failed to logout, please logout manually."
    );
  });

  // ------ Test 4️⃣ ------
  it("calls onSuccess after successful delete + logout", async () => {
    mockGetToken.mockResolvedValue({ token: "t1", refreshToken: "r1" });
    mockFetcher.mockResolvedValue({ ok: true });
    mockClearToken.mockResolvedValue(undefined);
    mockLogoutUser.mockResolvedValue(true);

    const { result } = renderHook(() =>
      useDeleteAccount({ fetcher: mockFetcher, logoutFn: mockLogoutUser, onSuccess, onError })
    );

    await act(async () => {
      const success = await result.current.deleteAccount();
      expect(success).toBe(true);
    });

    expect(mockFetcher).toHaveBeenCalledWith(`${API_BASE_URL}/auth/delete-account`, expect.any(Object));
    expect(mockLogoutUser).toHaveBeenCalledWith("t1", "r1");
    expect(onSuccess).toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  // ------ Test 5️⃣ ------
  it("handles fetch exception gracefully", async () => {
    mockGetToken.mockResolvedValue({ token: "t1", refreshToken: "r1" });
    mockFetcher.mockRejectedValue(new Error("network fail"));

    const { result } = renderHook(() =>
      useDeleteAccount({ fetcher: mockFetcher, onError })
    );

    await act(async () => {
      const success = await result.current.deleteAccount();
      expect(success).toBe(false);
    });

    expect(onError).toHaveBeenCalledWith("Failed to delete account");
    expect(mockLogoutUser).not.toHaveBeenCalled();
  });

  // ------ Test 6️⃣ ------
  it("resets isLoading to false after operation", async () => {
    mockGetToken.mockResolvedValue({ token: "t1", refreshToken: "r1" });
    mockFetcher.mockResolvedValue({ ok: true });
    mockLogoutUser.mockResolvedValue(true);

    const { result } = renderHook(() =>
      useDeleteAccount({ fetcher: mockFetcher, onSuccess })
    );

    await act(async () => {
      await result.current.deleteAccount();
    });

    expect(result.current.isLoading).toBe(false);
  });
});

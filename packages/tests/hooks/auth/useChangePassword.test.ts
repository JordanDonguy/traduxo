/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
import { useChangePassword } from "@traduxo/packages/hooks/auth/useChangePassword";

// ---- Mocks ----
const mockRefresh = jest.fn();
jest.mock("@traduxo/packages/contexts/AuthContext", () => ({
  useAuth: jest.fn(() => ({
    status: "authenticated",
    token: "fake-token",
    refresh: mockRefresh,
  })),
}));

describe("useChangePassword", () => {
  let mockFetch: jest.Mock;
  let mockUpdater: jest.Mock;
  let onSuccess: jest.Mock;
  let onError: jest.Mock;

  beforeEach(() => {
    mockFetch = jest.fn();
    mockUpdater = jest.fn().mockResolvedValue(undefined);
    onSuccess = jest.fn();
    onError = jest.fn();
    jest.clearAllMocks();
  });

  // ------ Test 1️⃣ ------
  it("rejects passwords shorter than 8 chars", async () => {
    const { result } = renderHook(() =>
      useChangePassword({ fetcher: mockFetch, onError })
    );

    await act(async () => {
      const success = await result.current.handleSubmit({
        password: "123",
        confirmPassword: "123",
      });
      expect(success).toBe(false);
    });

    expect(result.current.error).toBe(
      "Passwords must be at least 8 characters"
    );
    expect(mockFetch).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(
      "Passwords must be at least 8 characters"
    );
  });

  // ------ Test 2️⃣ ------
  it("rejects if password and confirmPassword don't match", async () => {
    const { result } = renderHook(() =>
      useChangePassword({ fetcher: mockFetch, onError })
    );

    await act(async () => {
      const success = await result.current.handleSubmit({
        password: "12345678",
        confirmPassword: "87654321",
      });
      expect(success).toBe(false);
    });

    expect(result.current.error).toBe(
      "New password and confirm password don't match"
    );
    expect(mockFetch).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(
      "New password and confirm password don't match"
    );
  });

  // ------ Test 3️⃣ ------
  it("handles API returning not-ok with explicit error", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Something went wrong" }),
    });

    const { result } = renderHook(() =>
      useChangePassword({
        isCredentials: true,
        fetcher: mockFetch,
        onError,
      })
    );

    await act(async () => {
      const success = await result.current.handleSubmit({
        currentPassword: "oldpass",
        password: "12345678",
        confirmPassword: "12345678",
      });
      expect(success).toBe(false);
    });

    expect(result.current.error).toBe("Something went wrong");
    expect(onError).toHaveBeenCalledWith("Something went wrong");
  });

  // ------ Test 4️⃣ ------
  it("handles API returning not-ok without error (create)", async () => {
    mockFetch.mockResolvedValue({ ok: false, json: async () => ({}) });

    const { result } = renderHook(() =>
      useChangePassword({
        isCredentials: false,
        fetcher: mockFetch,
        onError,
      })
    );

    await act(async () => {
      const success = await result.current.handleSubmit({
        password: "12345678",
        confirmPassword: "12345678",
      });
      expect(success).toBe(false);
    });

    expect(result.current.error).toBe("Error while creating your password");
    expect(onError).toHaveBeenCalledWith(
      "Error while creating your password"
    );
  });

  // ------ Test 5️⃣ ------
  it("handles API returning not-ok without error (update)", async () => {
    mockFetch.mockResolvedValue({ ok: false, json: async () => ({}) });

    const { result } = renderHook(() =>
      useChangePassword({
        isCredentials: true,
        fetcher: mockFetch,
        onError,
      })
    );

    await act(async () => {
      const success = await result.current.handleSubmit({
        currentPassword: "oldpass",
        password: "12345678",
        confirmPassword: "12345678",
      });
      expect(success).toBe(false);
    });

    expect(result.current.error).toBe("Error while updating your password");
    expect(onError).toHaveBeenCalledWith(
      "Error while updating your password"
    );
  });

  // ------ Test 6️⃣ ------
  it("successfully updates password (credentials user)", async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });

    const { result } = renderHook(() =>
      useChangePassword({
        isCredentials: true,
        fetcher: mockFetch,
        sessionUpdater: mockUpdater,
        onSuccess,
      })
    );

    await act(async () => {
      const success = await result.current.handleSubmit({
        currentPassword: "oldpass",
        password: "12345678",
        confirmPassword: "12345678",
      });
      expect(success).toBe(true);
    });

    expect(onSuccess).toHaveBeenCalledWith(
      "Your password has been updated"
    );
    expect(mockUpdater).toHaveBeenCalled();
    expect(result.current.error).toBe("");
  });

  // ------ Test 7️⃣ ------
  it("successfully creates password (non-credentials user)", async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });

    const { result } = renderHook(() =>
      useChangePassword({
        isCredentials: false,
        fetcher: mockFetch,
        sessionUpdater: mockUpdater,
        onSuccess,
      })
    );

    await act(async () => {
      const success = await result.current.handleSubmit({
        password: "12345678",
        confirmPassword: "12345678",
      });
      expect(success).toBe(true);
    });

    expect(onSuccess).toHaveBeenCalledWith(
      "Your password has been created"
    );
    expect(mockUpdater).toHaveBeenCalled();
  });

  // ------ Test 8️⃣ ------
  it("catches fetch exception and sets internal error", async () => {
    mockFetch.mockRejectedValue(new Error("network fail"));

    const { result } = renderHook(() =>
      useChangePassword({ fetcher: mockFetch, onError })
    );

    await act(async () => {
      const success = await result.current.handleSubmit({
        password: "12345678",
        confirmPassword: "12345678",
      });
      expect(success).toBe(false);
    });

    expect(result.current.error).toBe("Internal server error");
    expect(onError).toHaveBeenCalledWith("Internal server error");
  });
});

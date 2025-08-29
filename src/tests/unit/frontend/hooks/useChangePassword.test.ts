/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
import { useChangePassword } from "@/lib/client/hooks/useChangePassword";
import { toast } from "react-toastify";

// ---- Mocks ----
jest.mock("next-auth/react", () => ({
  useSession: () => ({
    data: null,
    status: "unauthenticated",
    update: jest.fn().mockResolvedValue(undefined),
  }),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

jest.mock("react-toastify", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

// ---- Tests ----
describe("useChangePassword", () => {
  let mockFetch: jest.Mock;
  let mockRouter: ReturnType<typeof import("next/navigation").useRouter>;
  let mockUpdater: jest.Mock;
  let mockToast: typeof toast;

  beforeEach(() => {
    mockFetch = jest.fn();
    mockRouter = {
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    };
    mockUpdater = jest.fn().mockResolvedValue(undefined);
    mockToast = { success: jest.fn(), error: jest.fn() } as unknown as typeof toast;
  });

  // ------ Test 1️⃣ ------
  it("rejects passwords shorter than 8 chars", async () => {
    const { result } = renderHook(() => useChangePassword({ fetcher: mockFetch }));

    await act(async () => {
      const success = await result.current.handleSubmit({ password: "123", confirmPassword: "123" });
      expect(success).toBe(false);
    });

    // Should show proper validation message
    expect(result.current.error).toBe("Passwords length must be at least 8 characters");
    // API call should NOT have happened
    expect(mockFetch).not.toHaveBeenCalled();
  });

  // ------ Test 2️⃣ ------
  it("rejects if password and confirmPassword don't match", async () => {
    const { result } = renderHook(() => useChangePassword({ fetcher: mockFetch }));

    await act(async () => {
      const success = await result.current.handleSubmit({ password: "12345678", confirmPassword: "87654321" });
      expect(success).toBe(false);
    });

    // Should show mismatch error
    expect(result.current.error).toBe("New password and confirm password don't match");
    // API call should NOT happen
    expect(mockFetch).not.toHaveBeenCalled();
  });

  // ------ Test 3️⃣ ------
  it("handles API returning not-ok with error message", async () => {
    // Simulate API returning an explicit error message
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Something went wrong" }),
    });

    const { result } = renderHook(() => useChangePassword({ isCredentials: true, fetcher: mockFetch }));

    await act(async () => {
      const success = await result.current.handleSubmit({ currentPassword: "oldpass", password: "12345678", confirmPassword: "12345678" });
      expect(success).toBe(false);
    });

    // Should display API error
    expect(result.current.error).toBe("Something went wrong");
    // No success toast
    expect(toast.success).not.toHaveBeenCalled();
  });

  // ------ Test 4️⃣ ------
  it("handles API returning not-ok without error message", async () => {
    // Simulate API returning no error string
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });

    const { result } = renderHook(() =>
      useChangePassword({ isCredentials: false, fetcher: mockFetch, toaster: mockToast, router: mockRouter, sessionUpdater: mockUpdater })
    );

    await act(async () => {
      const success = await result.current.handleSubmit({
        password: "12345678",
        confirmPassword: "12345678",
      });
      expect(success).toBe(false);
    });

    // Fallback error string should be set
    expect(result.current.error).toBe("Error while creating your password");
  });

  // ------ Test 5️⃣ ------
  it("handles API returning not-ok without error message for credentials user", async () => {
    // Simulate API returning no error string
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });

    const { result } = renderHook(() =>
      useChangePassword({ isCredentials: true, fetcher: mockFetch, toaster: mockToast, router: mockRouter, sessionUpdater: mockUpdater })
    );

    await act(async () => {
      const success = await result.current.handleSubmit({
        currentPassword: "oldpass",
        password: "12345678",
        confirmPassword: "12345678",
      });
      expect(success).toBe(false);
    });

    // Should hit the fallback for credentials user
    expect(result.current.error).toBe("Error while updating your password");
  });

  // ------ Test 6️⃣ ------
  it("successfully updates password for credentials user", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    const { result } = renderHook(() => useChangePassword({ isCredentials: true, fetcher: mockFetch, toaster: mockToast, router: mockRouter, sessionUpdater: mockUpdater }));

    await act(async () => {
      const success = await result.current.handleSubmit({ currentPassword: "oldpass", password: "12345678", confirmPassword: "12345678" });
      expect(success).toBe(true);
    });

    // Verify toast, router, and session update
    expect(mockToast.success).toHaveBeenCalledWith("Your password has been updated");
    expect(mockRouter.push).toHaveBeenCalledWith("/");
    expect(mockUpdater).toHaveBeenCalled();
    expect(result.current.error).toBe("");
  });

  // ------ Test 7️⃣ ------
  it("successfully creates password for non-credentials user", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    const mockToast = { success: jest.fn(), error: jest.fn() } as unknown as typeof toast;
    const { result } = renderHook(() => useChangePassword({ isCredentials: false, fetcher: mockFetch, toaster: mockToast, router: mockRouter, sessionUpdater: mockUpdater }));

    await act(async () => {
      const success = await result.current.handleSubmit({ password: "12345678", confirmPassword: "12345678" });
      expect(success).toBe(true);
    });

    // Verify success toast and navigation
    expect(mockToast.success).toHaveBeenCalledWith("Your password has been created");
    expect(mockRouter.push).toHaveBeenCalledWith("/");
    expect(mockUpdater).toHaveBeenCalled();
  });

  // ------ Test 8️⃣ ------
  it("catches fetch exception and sets internal error", async () => {
    mockFetch.mockRejectedValue(new Error("network fail"));

    const { result } = renderHook(() => useChangePassword({ fetcher: mockFetch }));

    await act(async () => {
      const success = await result.current.handleSubmit({ password: "12345678", confirmPassword: "12345678" });
      expect(success).toBe(false);
    });

    // Should show generic internal error
    expect(result.current.error).toBe("Internal server error");
    // No toast or router navigation should occur
    expect(mockToast.success).not.toHaveBeenCalled();
    expect(mockRouter.push).not.toHaveBeenCalled();
  });
});

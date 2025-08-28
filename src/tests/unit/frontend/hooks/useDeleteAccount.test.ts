/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
import { useDeleteAccount } from "@/lib/client/hooks/useDeleteAccount";
import { toast } from "react-toastify";
import * as nextNavigation from "next/navigation";

// ---- Mocks ----
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));
jest.mock("next-auth/react", () => ({
  signOut: jest.fn(),
}));
jest.mock("react-toastify", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));


// ---- Tests ----
describe("useDeleteAccount", () => {
  let mockFetcher: jest.Mock;
  let mockRouter: ReturnType<typeof nextNavigation.useRouter>;
  let mockSignOut: jest.Mock;
  let mockToast: typeof toast;

  // ---- Provide global fetch for default parameter testing ----
  beforeAll(() => {
    global.fetch = jest.fn();
  });

  beforeEach(() => {
    mockFetcher = jest.fn();
    mockRouter = { push: jest.fn(), replace: jest.fn() } as unknown as ReturnType<typeof nextNavigation.useRouter>;
    mockSignOut = jest.fn().mockResolvedValue(undefined);
    mockToast = { success: jest.fn(), error: jest.fn() } as unknown as typeof toast;
  });

  // ------ Test 1️⃣ ------
  it("uses default router if none is provided", () => {
    // Tests the branch: `const effectiveRouter = router ?? defaultRouter;`
    const { result } = renderHook(() =>
      useDeleteAccount({ fetcher: mockFetcher, signOutFn: mockSignOut, toaster: mockToast })
    );

    expect(result.current.deleteAccount).toBeDefined();
  });

  // ------ Test 2️⃣ ------
  it("uses default dependencies when none are passed", () => {
    // Tests default parameter branch: fetcher=fetch, toaster=toast, signOutFn=signOut
    const { result } = renderHook(() => useDeleteAccount());
    expect(result.current.deleteAccount).toBeDefined();
  });

  // ------ Test 3️⃣ ------
  it("calls signOut and redirects on successful deletion", async () => {
    // Tests successful path: res.ok = true → signOut called, redirect, loading reset
    mockFetcher.mockResolvedValue({ ok: true, json: async () => ({}) });

    const { result } = renderHook(() =>
      useDeleteAccount({ fetcher: mockFetcher, router: mockRouter, signOutFn: mockSignOut, toaster: mockToast })
    );

    await act(async () => {
      await result.current.deleteAccount();
    });

    expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: "/?delete=true" });
    expect(mockRouter.push).toHaveBeenCalledWith("/");
    expect(result.current.isLoading).toBe(false);
  });

  // ------ Test 4️⃣ ------
  it("uses default error message when API returns no message", async () => {
    // Tests the fallback: !res.ok && !data.message → default toast error
    mockFetcher.mockResolvedValue({ ok: false, json: async () => ({}) });

    const { result } = renderHook(() =>
      useDeleteAccount({ fetcher: mockFetcher, router: mockRouter, signOutFn: mockSignOut, toaster: mockToast })
    );

    await act(async () => {
      await result.current.deleteAccount();
    });

    expect(mockToast.error).toHaveBeenCalledWith("Failed to delete account");
    expect(mockRouter.push).toHaveBeenCalledWith("/");
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  // ------ Test 5️⃣ ------
  it("handles fetch exceptions gracefully", async () => {
    // Tests the try/catch branch when fetch rejects → fallback toast, redirect
    mockFetcher.mockRejectedValue(new Error("network fail"));

    const { result } = renderHook(() =>
      useDeleteAccount({ fetcher: mockFetcher, router: mockRouter, signOutFn: mockSignOut, toaster: mockToast })
    );

    await act(async () => {
      await result.current.deleteAccount();
    });

    expect(mockToast.error).toHaveBeenCalledWith("Failed to delete account");
    expect(mockRouter.push).toHaveBeenCalledWith("/");
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  // ------ Test 6️⃣ ------
  it("handles API returning non-ok with invalid JSON data", async () => {
    // Tests branch: !res.ok && res.json() returns null → fallback toast
    mockFetcher.mockResolvedValue({ ok: false, json: async () => null });

    const { result } = renderHook(() =>
      useDeleteAccount({ fetcher: mockFetcher, router: mockRouter, signOutFn: mockSignOut, toaster: mockToast })
    );

    await act(async () => {
      await result.current.deleteAccount();
    });

    expect(mockToast.error).toHaveBeenCalledWith("Failed to delete account");
    expect(mockRouter.push).toHaveBeenCalledWith("/");
    expect(mockSignOut).not.toHaveBeenCalled();
  });
});

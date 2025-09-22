/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
import { useWaitForAuthStatus } from "@traduxo/packages/hooks/auth/useWaitForAuthStatus";

// Use fake timers to control hook's interval/timeout behavior
jest.useFakeTimers();

describe("useWaitForAuthStatus", () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  // ------ Test 1️⃣ ------
  it("resolves immediately when status is not 'loading' (ready initially)", async () => {
    // Verify hook is ready immediately when session status !== "loading"
    const sessionHook = (): { status: "authenticated" | "loading" | "unauthenticated"; refresh: () => Promise<void> } => ({
      status: "authenticated",
      refresh: jest.fn(async () => { }),
    });

    const { result } = renderHook(() => useWaitForAuthStatus({ sessionHook }));

    expect(result.current.ready).toBe(true);
    await expect(result.current.waitForStatus()).resolves.toBeUndefined();
  });

  // ------ Test 2️⃣ ------
  it("polls (calls refresh) and resolves after status flips from 'loading' to ready", async () => {
    // Simulate refresh flipping status from "loading" -> "authenticated"
    // and ensure polling calls refresh and resolves after rerender

    // Initial status is "loading"
    let statusValue: "loading" | "authenticated" = "loading";
    let rerenderFn: () => void;

    // Mock refresh flips status and triggers a rerender so the hook sees the new status
    const mockRefresh = jest.fn(async () => {
      statusValue = "authenticated";
      act(() => {
        rerenderFn?.();
      });
      return Promise.resolve();
    });

    // sessionHook returns current status and refresh function
    const sessionHook = (): { status: "loading" | "authenticated"; refresh: () => Promise<void> } => ({
      status: statusValue,
      refresh: mockRefresh,
    });

    // Render hook and capture rerender function for later use in mockRefresh
    // We have to assign rerender fn after calling the hook because we have to grab it from there
    const { result, rerender } = renderHook(() => useWaitForAuthStatus({ sessionHook }));
    rerenderFn = rerender;

    // Initially not ready
    expect(result.current.ready).toBe(false);

    // Start waitForStatus, which polls every 200ms
    const waitPromise = result.current.waitForStatus(5000);

    await act(async () => {
      jest.advanceTimersByTime(200); // trigger one interval tick
      await Promise.resolve();       // flush async/mockRefresh
    });

    // After status flips and rerender, promise resolves
    await expect(waitPromise).resolves.toBeUndefined();

    // Hook state updated and refresh was called
    expect(result.current.ready).toBe(true);
    expect(mockRefresh).toHaveBeenCalled();
  });

  // ------ Test 3️⃣ ------
  it("rejects with timeout if status remains 'loading'", async () => {
    // Ensure waitForStatus rejects on timeout and avoid unhandled rejection
    const sessionHook = (): { status: "loading" | "authenticated"; refresh: () => Promise<void> } => ({
      status: "loading",
      refresh: jest.fn(async () => { }),
    });

    const { result } = renderHook(() => useWaitForAuthStatus({ sessionHook }));

    // Attach rejection expectation BEFORE advancing timers to prevent unhandled rejection
    const waitPromise = result.current.waitForStatus(1000);
    const assertion = expect(waitPromise).rejects.toThrow("Auth status timeout");

    await act(async () => {
      jest.advanceTimersByTime(1200); // pass the timeout
      await Promise.resolve();
    });

    await assertion;
  });
});

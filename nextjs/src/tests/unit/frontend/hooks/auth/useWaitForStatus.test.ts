/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
import { useWaitForAuthStatus } from "@/lib/client/hooks/auth/useWaitForAuthStatus";
import { useAuth } from "@traduxo/packages/contexts/AuthContext";

// ---- Mocks ----
jest.mock("@traduxo/packages/contexts/AuthContext", () => ({
  useAuth: jest.fn(),
}));


// ---- Tests ----
describe("useWaitForAuthStatus", () => {
  beforeAll(() => {
    // Use fake timers to control setInterval behavior
    jest.useFakeTimers();
  });
  afterAll(() => {
    jest.useRealTimers();
  });

  // ------ Test 1️⃣ ------
  it("resolves immediately if status is not loading", async () => {
    (useAuth as jest.Mock).mockReturnValue({
      status: "authenticated",
      token: "fake-token",
      providers: [],
      language: "en",
      refresh: jest.fn(),
    });

    // Render the hook
    const { result } = renderHook(() => useWaitForAuthStatus());

    // The hook should already be ready
    expect(result.current.ready).toBe(true);

    // Call waitForStatus and ensure it resolves immediately
    let resolved = false;
    await act(async () => {
      await result.current.waitForStatus();
      resolved = true;
    });

    expect(resolved).toBe(true);
  });

  // ------ Test 2️⃣ ------
  it("polls until status changes from 'loading' and clears interval", async () => {
    // Initial status is "loading"
    let currentStatus: "loading" | "authenticated" = "loading";

    // Mock useAuth to return currentStatus dynamically
    (useAuth as jest.Mock).mockImplementation(() => ({
      status: currentStatus,
      token: null,
      providers: [],
      language: null,
      refresh: jest.fn(),
    }));

    // ---- Mock setInterval to capture the callback ----
    let intervalCallback: () => void;
    const mockInterval = ((cb: () => void) => {
      intervalCallback = cb; // store callback for manual triggering
      return {} as NodeJS.Timeout; // fake interval ID
    }) as unknown as typeof setInterval;

    // Mock clearInterval to track when the interval is cleared
    const mockClearInterval = jest.fn();

    // Render the hook with injected mocks
    const { result, rerender } = renderHook(() =>
      useWaitForAuthStatus({
        intervalFn: mockInterval,
        clearIntervalFn: mockClearInterval,
      })
    );

    // Initially ready should be false
    expect(result.current.ready).toBe(false);

    // Call waitForStatus (it should poll because ready = false)
    let resolved = false;
    act(() => {
      result.current.waitForStatus().then(() => {
        resolved = true;
      });
    });

    // ---- Simulate status changing after some time ----
    currentStatus = "authenticated";
    rerender(); // rerender to reflect status change

    // Manually trigger the interval callback to simulate polling
    act(() => intervalCallback());

    // Allow any pending promises to resolve
    await act(() => Promise.resolve());

    // ---- Assertions ----
    expect(resolved).toBe(true); // waitForStatus resolved
    expect(mockClearInterval).toHaveBeenCalled(); // interval cleared
    expect(result.current.status).toBe("authenticated"); // status updated
  });
});

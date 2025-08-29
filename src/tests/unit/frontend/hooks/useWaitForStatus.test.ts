/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
import { useWaitForAuthStatus } from "@/lib/client/hooks/useWaitForAuthStatus";
import { useSession } from "next-auth/react";

// ---- Mocks ----
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
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
    // Mock a session with status "authenticated"
    (useSession as jest.Mock).mockReturnValue({
      data: null,
      status: "authenticated",
      update: jest.fn(),
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

    // Mock useSession to return currentStatus dynamically
    (useSession as jest.Mock).mockImplementation(() => ({
      data: null,
      status: currentStatus,
      update: jest.fn(),
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

/**
 * @jest-environment jsdom
 */

import { renderHook, act } from "@testing-library/react";
import { useCooldown } from "@traduxo/packages/hooks/ui/useCooldown";

describe("useCooldown hook", () => {
  beforeAll(() => {
    // Use fake timers so we can fast-forward time
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  // ------ Test 1️⃣ ------
  it("returns undefined when start is false", () => {
    const { result } = renderHook(() => useCooldown(false));

    // Since cooldown not started, result should be undefined
    expect(result.current).toBeUndefined();
  });

  // ------ Test 2️⃣ ------
  it("initializes at 60 seconds when started", () => {
    const { result } = renderHook(() => useCooldown(true));

    // Immediately after starting, count should be 60
    expect(result.current).toBe(60);
  });

  // ------ Test 3️⃣ ------
  it("counts down every second until 0", () => {
    const { result } = renderHook(() => useCooldown(true));

    // Step 1: Fast-forward 1 second
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current).toBe(59);

    // Step 2: Fast-forward 10 more seconds
    act(() => {
      jest.advanceTimersByTime(10000);
    });
    expect(result.current).toBe(49);

    // Step 3: Fast-forward until it reaches 0
    act(() => {
      jest.advanceTimersByTime(49000); // 49 seconds left
    });

    expect(result.current).toBe(0);
  });

  // ------ Test 4️⃣ ------
  it("clears interval when start becomes false", () => {
    const { result, rerender } = renderHook(({ start }) => useCooldown(start), {
      initialProps: { start: true },
    });

    // Fast-forward a few seconds
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(result.current).toBe(57);

    // Stop cooldown
    rerender({ start: false });

    // Fast-forward another few seconds
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    // Should remain unchanged since cooldown stopped
    expect(result.current).toBeUndefined();
  });
});

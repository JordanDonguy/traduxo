/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
import { useSwitchTranslations } from "@/lib/client/hooks/useSwitchTranslations";
import { swapMainTranslation } from "@/lib/client/utils/swapMainTranslation";

// ---- Mocks----
jest.mock("@/lib/client/utils/swapMainTranslation", () => ({
  swapMainTranslation: jest.fn((arr) => [...arr].reverse()), // simple mock for testing
}));

// ---- Tests ----
describe("useSwitchTranslations", () => {
  let mockSetTranslatedText: jest.Mock;

  // ---- Setup fake timers and mocks ----
  beforeAll(() => jest.useFakeTimers());
  afterAll(() => jest.useRealTimers());
  beforeEach(() => {
    mockSetTranslatedText = jest.fn();
  });

  // ------ Test 1️⃣ ------
  it("initializes fading state as empty", () => {
    const { result } = renderHook(() =>
      useSwitchTranslations({ setTranslatedText: mockSetTranslatedText })
    );

    // Fading array should start empty
    expect(result.current.fading).toEqual([]);
  });

  // ------ Test 2️⃣ ------
  it("updates fading state and calls setTranslatedText after timeout", () => {
    const { result } = renderHook(() =>
      useSwitchTranslations({ setTranslatedText: mockSetTranslatedText })
    );

    // Trigger switch for idx 0
    act(() => {
      result.current.switchTranslations(0);
    });

    // Immediately after calling, fading should include main and selected alt
    expect(result.current.fading).toEqual([1, 2]);

    // Fast-forward 200ms for the fade animation
    act(() => {
      jest.advanceTimersByTime(200);
    });

    // setTranslatedText should have been called
    expect(mockSetTranslatedText).toHaveBeenCalled();

    // Fading state should reset after swap
    expect(result.current.fading).toEqual([]);
  });

  // ------ Test 3️⃣ ------
  it("calls swapMainTranslation with correct arguments", () => {
    const initialArray = ["main", "alt1", "alt2", "alt3"];

    // Mock setTranslatedText to simulate React state updater
    const mockSetTranslatedText = jest.fn((updater) => {
      if (typeof updater === "function") updater(initialArray);
    });

    const { result } = renderHook(() =>
      useSwitchTranslations({ setTranslatedText: mockSetTranslatedText })
    );

    // Trigger switch for idx 1 -> altIdx = 3
    act(() => {
      result.current.switchTranslations(1);
    });

    // Fast-forward 200ms for fade animation
    act(() => {
      jest.advanceTimersByTime(200);
    });

    // swapMainTranslation should have been called with correct array and index
    expect(swapMainTranslation).toHaveBeenCalledWith(initialArray, 3);
  });
});

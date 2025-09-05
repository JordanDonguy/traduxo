/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
import { useSwitchTranslations } from "@/lib/client/hooks/translation/useSwitchTranslations";
import { swapMainTranslation } from "@/lib/client/utils/translation/swapMainTranslation";
import { TranslationItem } from "@traduxo/packages/types/translation";

// ---- Mock swapMainTranslation ----
// We mock it but also call through so the hook actually executes it
jest.mock("@/lib/client/utils/translation/swapMainTranslation", () => {
  const original = jest.requireActual("@/lib/client/utils/translation/swapMainTranslation");
  return {
    __esModule: true,
    swapMainTranslation: jest.fn((arr, main, alt) => original.swapMainTranslation(arr, main, alt)),
  };
});

describe("useSwitchTranslations", () => {
  let mockSetTranslatedText: jest.Mock;
  const initialTranslatedText: TranslationItem[] = [
    { value: "main", type: "main_translation" },
    { value: "alt1", type: "alternative" },
    { value: "alt2", type: "alternative" },
  ];

  beforeAll(() => jest.useFakeTimers());
  afterAll(() => jest.useRealTimers());
  beforeEach(() => {
    mockSetTranslatedText = jest.fn((updater) => {
      // Call the updater function to trigger swapMainTranslation
      if (typeof updater === "function") {
        updater(initialTranslatedText);
      }
    });
    (swapMainTranslation as jest.Mock).mockClear();
  });

  // ------ Test 1️⃣ ------
  it("initializes fading state as empty", () => {
    const { result } = renderHook(() =>
      useSwitchTranslations({ translatedText: initialTranslatedText, setTranslatedText: mockSetTranslatedText })
    );

    expect(result.current.fading).toEqual([]);
  });

  // ------ Test 2️⃣ ------
  it("updates fading state and calls setTranslatedText after timeout", () => {
    const { result } = renderHook(() =>
      useSwitchTranslations({ translatedText: initialTranslatedText, setTranslatedText: mockSetTranslatedText })
    );

    // Trigger switch for "alt2"
    act(() => {
      result.current.switchTranslations("alt2");
    });

    // Immediately after calling, fading should include main and selected alt values
    expect(result.current.fading).toEqual(["main", "alt2"]);

    // Fast-forward 200ms
    act(() => {
      jest.advanceTimersByTime(200);
    });

    // setTranslatedText should have been called once
    expect(mockSetTranslatedText).toHaveBeenCalledTimes(1);

    // Because setTranslatedText receives an updater function, we can call it with initialTranslatedText
    const updater = mockSetTranslatedText.mock.calls[0][0];
    const updatedArray = typeof updater === "function" ? updater(initialTranslatedText) : updater;
    expect(updatedArray).toEqual(initialTranslatedText);

    // Fading state should reset
    expect(result.current.fading).toEqual([]);
  });

  it("calls swapMainTranslation with correct arguments", () => {
    const { result } = renderHook(() =>
      useSwitchTranslations({ translatedText: initialTranslatedText, setTranslatedText: mockSetTranslatedText })
    );

    const mainValue = initialTranslatedText.find(t => t.type === "main_translation")?.value;

    // Trigger switch for "alt2"
    act(() => {
      result.current.switchTranslations("alt2");
    });

    // Fast-forward 200ms
    act(() => {
      jest.advanceTimersByTime(200);
    });

    // swapMainTranslation should have been called once
    expect(swapMainTranslation).toHaveBeenCalledTimes(1);

    // Use dynamic mainValue instead of hardcoded "main"
    expect(swapMainTranslation).toHaveBeenCalledWith(initialTranslatedText, mainValue, "alt2");
  });
});

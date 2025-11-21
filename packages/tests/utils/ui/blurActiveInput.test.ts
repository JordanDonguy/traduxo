/**
 * @jest-environment jsdom
 */
import { blurActiveInput } from "@traduxo/packages/utils/ui/blurActiveInput";

describe("blurActiveInput", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  // ------ Test 1️⃣ ------
  it("blurs the active input element on web", () => {
    process.env.NEXT_PUBLIC_PLATFORM = "web";

    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    const active = document.activeElement as HTMLElement;
    const blurSpy = jest.spyOn(active, "blur");

    blurActiveInput();

    expect(blurSpy).toHaveBeenCalled();

    document.body.removeChild(input);
  });

  // ------ Test 2️⃣ ------
  it("does nothing if no element is focused on web", () => {
    process.env.NEXT_PUBLIC_PLATFORM = "web";

    const activeBefore = document.activeElement;
    blurActiveInput();
    expect(document.activeElement).toBe(activeBefore);
  });

  // ------ Test 3️⃣ ------
  it("calls Keyboard.dismiss on react-native", () => {
    process.env.EXPO_PUBLIC_PLATFORM = "react-native";

    const mockDismiss = jest.fn();
    blurActiveInput({ dismiss: mockDismiss });
    expect(mockDismiss).toHaveBeenCalled();
  });

  // ------ Test 4️⃣ ------
  it("warns if RN Keyboard module is not provided", () => {
    process.env.EXPO_PUBLIC_PLATFORM = "react-native";

    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => { });
    blurActiveInput();
    expect(warnSpy).toHaveBeenCalledWith(
      "RN Keyboard module not provided. Cannot dismiss keyboard."
    );
    warnSpy.mockRestore();
  });

  // ------ Test 5️⃣ ------
  it("does nothing if PLATFORM is not set", () => {
    delete process.env.NEXT_PUBLIC_PLATFORM;
    delete process.env.EXPO_PUBLIC_PLATFORM;

    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => { }); // silence console warn

    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();

    const active = document.activeElement as HTMLElement;
    const blurSpy = jest.spyOn(active, "blur");

    blurActiveInput();
    expect(blurSpy).not.toHaveBeenCalled();

    document.body.removeChild(input);
    warnSpy.mockRestore(); // restore console warn
  });
});

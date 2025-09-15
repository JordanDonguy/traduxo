/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom"
import { render, screen, fireEvent, act } from "@testing-library/react";
import LandingDisplay from "@/components/main-section/LandingDisplay";
import { useSuggestion } from "@traduxo/packages/hooks/suggestion/useSuggestion";

jest.mock("@traduxo/packages/hooks/suggestion/useSuggestion");

describe("LandingDisplay", () => {
  const suggestTranslation = jest.fn();
  const originalInnerWidth = window.innerWidth;

  beforeEach(() => {
    // Inject mock into the hook
    (useSuggestion as jest.Mock).mockReturnValue({ suggestTranslation });
    // Use fake timers so we can advance `setTimeout` manually
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    // Reset window size after each test
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: originalInnerWidth,
    });
  });

  // ------ Test 1️⃣ -------
  it("renders headline and buttons", () => {
    render(<LandingDisplay />);
    // Headline text
    expect(screen.getByText(/What can I do for you today/i)).toBeInTheDocument();
    // Buttons
    expect(screen.getByText(/Suggest an expression/i)).toBeInTheDocument();
    expect(screen.getByText(/Translate something/i)).toBeInTheDocument();
  });

  // ------ Test 2️⃣ -------
  it("calls suggestTranslation when clicking suggest button", () => {
    render(<LandingDisplay />);
    fireEvent.click(screen.getByText(/Suggest an expression/i));
    expect(suggestTranslation).toHaveBeenCalled();
  });

  // ------ Test 3️⃣ -------
  it("focuses input when clicking translate button", () => {
    render(
      <>
        {/* Fake input so we can check if focus() is called */}
        <input data-testid="mock-input" />
        <LandingDisplay />
      </>
    );

    const input = screen.getByTestId("mock-input");
    const focusSpy = jest.spyOn(input, "focus");

    fireEvent.click(screen.getByText(/Translate something/i));
    expect(focusSpy).toHaveBeenCalled();
  });

  // ------ Test 4️⃣ -------
  it("shows and hides warning message on large screen", () => {
    // Simulate desktop viewport
    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 1024 });

    render(<LandingDisplay />);
    const btn = screen.getByText(/Translate something/i);

    fireEvent.click(btn);
    // Immediately visible after click
    expect(screen.getByText(/Please enter some text/i)).toBeVisible();

    // Advance timers by 4s (the warning disappears after timeout)
    act(() => {
      jest.advanceTimersByTime(4000);
    });

    // Should be hidden again (parent div has opacity-0)
    expect(screen.getByText(/Please enter some text/i).parentElement).toHaveClass("opacity-0");
  });

  // ------ Test 5️⃣ -------
  it("shows the warning on large screens and hides it after 4000ms", () => {
    // Explicitly simulate desktop
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 1024,
    });

    render(<LandingDisplay />);

    // Walk up DOM tree to find the warning container
    const innerSpan = screen.getByText(/Please enter some text here and press enter key/i);
    let warningBox: Element | null = innerSpan.parentElement;
    while (warningBox && !warningBox.className.includes("bg-warning")) {
      warningBox = warningBox.parentElement;
    }
    expect(warningBox).toBeTruthy();

    // Initially hidden (scale-y-0 / opacity-0)
    expect(warningBox).toHaveClass("scale-y-0");
    expect(warningBox).toHaveClass("opacity-0");

    // Click should show it
    const translateBtn = screen.getByRole("button", { name: /Translate something/i });
    fireEvent.click(translateBtn);
    expect(warningBox).toHaveClass("scale-y-100");
    expect(warningBox).toHaveClass("opacity-95");

    // After 4s should hide again
    act(() => {
      jest.advanceTimersByTime(4000);
    });
    expect(warningBox).toHaveClass("scale-y-0");
    expect(warningBox).toHaveClass("opacity-0");
  });

  // ------ Test 6️⃣ -------
  it("does NOT show warning when window.innerWidth <= 768", () => {
    // Simulate mobile viewport
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 500,
    });

    render(<LandingDisplay />);

    const translateBtn = screen.getByRole("button", { name: /Translate something/i });
    fireEvent.click(translateBtn);

    // Warning is always in the DOM, but should remain hidden
    const innerSpan = screen.getByText(/Please enter some text here and press enter key/i);
    let warningBox: Element | null = innerSpan.parentElement;
    while (warningBox && !warningBox.className.includes("bg-warning")) {
      warningBox = warningBox.parentElement;
    }
    expect(warningBox).toHaveClass("scale-y-0");
    expect(warningBox).toHaveClass("opacity-0");
  });
});

/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ErrorSection from "@/components/main-section/ErrorSection";
import { useCooldown } from "@/lib/client/hooks/ui/useCooldown";
import { useApp } from "@/context/AppContext";

// ------ Mocks ------
jest.mock("@/lib/client/hooks/ui/useCooldown");
jest.mock("@/context/AppContext");

describe("ErrorSection component", () => {
  const setError = jest.fn();
  const setShowLoginForm = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useApp as jest.Mock).mockReturnValue({ setShowLoginForm });
  });

  // ------ Test 1️⃣ ------
  it("renders error text correctly", () => {
    (useCooldown as jest.Mock).mockReturnValue(0);

    render(<ErrorSection error="Some error" setError={setError} />);

    expect(screen.getByText("Some error")).toBeInTheDocument();
  });

  // ------ Test 2️⃣ ------
  it("shows login button when error starts with 'To continue using'", () => {
    (useCooldown as jest.Mock).mockReturnValue(0);

    render(<ErrorSection error="To continue using the app" setError={setError} />);

    const loginButton = screen.getByRole("button", { name: /login/i });
    expect(loginButton).toBeInTheDocument();

    fireEvent.click(loginButton);
    expect(setShowLoginForm).toHaveBeenCalledWith(true);
  });

  // ------ Test 3️⃣ ------
  it("displays cooldown when useCooldown returns positive number", () => {
    (useCooldown as jest.Mock).mockReturnValue(5);

    render(<ErrorSection error="Too many requests" setError={setError} />);

    expect(screen.getByText("Try again in 0:05 🙏")).toBeInTheDocument();
  });

  // ------ Test 4️⃣ ------
  it("resets error when cooldown reaches 0 for rate limiting errors", () => {
    (useCooldown as jest.Mock).mockReturnValue(0);

    render(<ErrorSection error="Too many requests" setError={setError} />);

    expect(setError).toHaveBeenCalledWith("");
  });

  // ------ Test 5️⃣ ------
  it("does not reset error if cooldown is 0 but error is not rate limiting", () => {
    (useCooldown as jest.Mock).mockReturnValue(0);

    render(<ErrorSection error="Some other error" setError={setError} />);

    expect(setError).not.toHaveBeenCalled();
  });
});

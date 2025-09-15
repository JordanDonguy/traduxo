/**
 * @jest-environment jsdom
 */

import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import TranslationHistory from "@/components/menu/TranslationHistory";

// ---- Mock hooks ----
// Mock translation history hook
jest.mock("@traduxo/packages/hooks/history/useTranslationHistory", () => ({
  useTranslationHistory: jest.fn(),
}));

// Mock translation selection hook
jest.mock("@traduxo/packages/hooks/translation/useSelectTranslation", () => ({
  useSelectTranslation: jest.fn(),
}));

// ---- Mock lucide-react icon ----
// Mock CircleX icon
jest.mock("lucide-react", () => ({
  CircleX: () => <div>CircleXIcon</div>
}));

import { useTranslationHistory } from "@traduxo/packages/hooks/history/useTranslationHistory";
import { useSelectTranslation } from "@traduxo/packages/hooks/translation/useSelectTranslation";


// ---- Tests ----
describe("<TranslationHistory />", () => {
  const mockDeleteTranslation = jest.fn();
  const mockSelectTranslation = jest.fn();

  beforeEach(() => {
    (useSelectTranslation as jest.Mock).mockReturnValue({
      selectTranslation: mockSelectTranslation
    });
  });

  // ------ Test 1️⃣ ------
  it("applies opacity-100 when showMenu is true and opacity-0 when false", () => {
    (useTranslationHistory as jest.Mock).mockReturnValue({
      translationHistory: [],
      isLoading: false,
      status: "authenticated",
      deleteTranslation: mockDeleteTranslation,
    });

    const { rerender, container } = render(<TranslationHistory showMenu={true} />);
    let div = container.querySelector("div");
    expect(div).toHaveClass("opacity-100");

    rerender(<TranslationHistory showMenu={false} />);
    div = container.querySelector("div");
    expect(div).toHaveClass("opacity-0");
  });

  // ------ Test 2️⃣ ------
  it("renders loading spinner when isLoading is true", () => {
    (useTranslationHistory as jest.Mock).mockReturnValue({
      translationHistory: [],
      isLoading: true,
      status: "authenticated",
      deleteTranslation: mockDeleteTranslation,
    });

    render(<TranslationHistory showMenu={true} />);
    // Expect a spinner element to be present
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  // ------ Test 3️⃣ ------
  it("renders translation history items", () => {
    const history = [
      { id: "1", inputLang: "en", inputText: "Hello", outputLang: "fr", translation: "Bonjour" },
      { id: "2", inputLang: "es", inputText: "Hola", outputLang: "en", translation: "Hi" }
    ];
    (useTranslationHistory as jest.Mock).mockReturnValue({
      translationHistory: history,
      isLoading: false,
      status: "authenticated",
      deleteTranslation: mockDeleteTranslation,
    });

    render(<TranslationHistory showMenu={true} />);

    // Check that all history items are rendered
    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("Bonjour")).toBeInTheDocument();
    expect(screen.getByText("Hola")).toBeInTheDocument();
    expect(screen.getByText("Hi")).toBeInTheDocument();
  });

  // ------ Test 4️⃣ ------
  it("calls selectTranslation when a history item is clicked", () => {
    const history = [{ id: "1", inputLang: "en", inputText: "Hello", outputLang: "fr", translation: "Bonjour" }];
    (useTranslationHistory as jest.Mock).mockReturnValue({
      translationHistory: history,
      isLoading: false,
      status: "authenticated",
      deleteTranslation: mockDeleteTranslation,
    });

    render(<TranslationHistory showMenu={true} />);
    const article = screen.getByText("Hello").closest("article")!;
    fireEvent.click(article);

    // Ensure the selectTranslation callback is called with correct parameters
    expect(mockSelectTranslation).toHaveBeenCalledWith(history[0], false);
  });

  // ------ Test 5️⃣ ------
  it("calls deleteTranslation when delete button is clicked and does not trigger selectTranslation", () => {
    const history = [{ id: "1", inputLang: "en", inputText: "Hello", outputLang: "fr", translation: "Bonjour" }];
    (useTranslationHistory as jest.Mock).mockReturnValue({
      translationHistory: history,
      isLoading: false,
      status: "authenticated",
      deleteTranslation: mockDeleteTranslation,
    });

    render(<TranslationHistory showMenu={true} />);
    const deleteDiv = screen.getByText("CircleXIcon").parentElement!;
    fireEvent.click(deleteDiv);

    // Ensure deleteTranslation is called and selectTranslation is not triggered
    expect(mockDeleteTranslation).toHaveBeenCalledWith("1");
    expect(mockSelectTranslation).not.toHaveBeenCalled();
  });

  // ------ Test 6️⃣ ------
  it("displays messages for unauthenticated or empty history", () => {
    // Unauthenticated user
    (useTranslationHistory as jest.Mock).mockReturnValue({
      translationHistory: [],
      isLoading: false,
      status: "unauthenticated",
      deleteTranslation: mockDeleteTranslation,
    });
    const { rerender } = render(<TranslationHistory showMenu={true} />);
    expect(screen.getByText("You need to log in to have access to your translation history")).toBeInTheDocument();

    // Authenticated but empty history
    (useTranslationHistory as jest.Mock).mockReturnValue({
      translationHistory: [],
      isLoading: false,
      status: "authenticated",
      deleteTranslation: mockDeleteTranslation,
    });
    rerender(<TranslationHistory showMenu={true} />);
    expect(screen.getByText("No translations found in history...")).toBeInTheDocument();
  });
});

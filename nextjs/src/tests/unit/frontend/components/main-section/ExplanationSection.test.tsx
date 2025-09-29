/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ExplanationSection from "@/components/main-section/ExplanationSection";
import { useExplanation } from "@traduxo/packages/hooks/explanation/useExplanation";
import { TranslationItem } from "@traduxo/packages/types/translation";

// ------ Mocks ------
jest.mock("@traduxo/packages/hooks/explanation/useExplanation");
jest.mock("@/components/main-section/ErrorSection", () => ({
  __esModule: true,
  default: () => <div>ErrorSection</div>,
}));
jest.mock("@/components/main-section/LoadingAnimation", () => ({
  __esModule: true,
  default: () => <div>LoadingAnimation</div>,
}));
jest.mock("react-markdown", () => ({
  __esModule: true,
  default: ({ children }: React.PropsWithChildren<unknown>) => {
    // naive conversion: **text** → <strong>text</strong>
    const content = (children as string).replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    return <div dangerouslySetInnerHTML={{ __html: content }} />;
  },
}));

describe("ExplanationSection component", () => {
  const handleExplanation = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useExplanation as jest.Mock).mockReturnValue({
      handleExplanation,
      isExpLoading: false,
      explanationError: "",
      setExplanationError: jest.fn(),
    });
  });

  // ------ Test 1️⃣ ------
  it("renders ErrorSection when there is an explanationError", () => {
    const setExplanationError = jest.fn();
    (useExplanation as jest.Mock).mockReturnValue({
      handleExplanation,
      isExpLoading: false,
      explanationError: "Some error",
      setExplanationError,
    });

    const translatedText: TranslationItem[] = [];

    render(<ExplanationSection explanation="" translatedText={translatedText} />);
    expect(screen.getByText("ErrorSection")).toBeInTheDocument();
  });

  // ------ Test 2️⃣ ------
  it("renders explanation content when explanation is provided", () => {
    const translatedText: TranslationItem[] = [];
    render(<ExplanationSection explanation="**Hello**" translatedText={translatedText} />);
    expect(screen.getByText("Hello")).toBeInTheDocument(); // Markdown rendered
  });

  // ------ Test 3️⃣ ------
  it("renders AI explanation button when no error, no explanation, and not loading", () => {
    const translatedText: TranslationItem[] = [
      { type: "expression", value: "Hello" },
      { type: "main_translation", value: "World" },
    ];

    render(
      <ExplanationSection explanation="" translatedText={translatedText} />
    );

    const button = screen.getByTestId("explanation-button");
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(handleExplanation).toHaveBeenCalled();
  });

  // ------ Test 4️⃣ ------
  it("applies visible animation when translatedText.length > 3", () => {
    const translatedText: TranslationItem[] = [
      { type: "expression", value: "1" },
      { type: "main_translation", value: "2" },
      { type: "alternative", value: "3" },
      { type: "alternative", value: "4" },
    ];

    render(
      <ExplanationSection explanation="" translatedText={translatedText} />
    );

    const container = screen.getByTestId("explanation-button")
      .parentElement;

    expect(container).toHaveClass("scale-x-100", "opacity-100");
  });

  // ------ Test 5️⃣ ------
  it("applies hidden animation when translatedText.length <= 3", () => {
    const translatedText: TranslationItem[] = [
      { type: "expression", value: "1" },
      { type: "main_translation", value: "2" },
    ];

    render(
      <ExplanationSection explanation="" translatedText={translatedText} />
    );

    const container = screen.getByTestId("explanation-button")
      .parentElement;

    expect(container).toHaveClass("scale-x-0", "opacity-0");
  });
});

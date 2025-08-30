/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ExplanationSection from "@/components/ExplanationSection";
import { useExplanation } from "@/lib/client/hooks/useExplanation";

// ------ Mocks ------
jest.mock("@/lib/client/hooks/useExplanation");
jest.mock("@/components/ErrorSection", () => ({
  __esModule: true,
  default: () => <div>ErrorSection</div>,
}));
jest.mock("@/components/LoadingAnimation", () => ({
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

    render(<ExplanationSection explanation="" mounted={true} ready={true} />);
    expect(screen.getByText("ErrorSection")).toBeInTheDocument();
  });

  // ------ Test 2️⃣ ------
  it("renders explanation content when explanation is provided", () => {
    render(<ExplanationSection explanation="**Hello**" mounted={true} ready={true} />);
    expect(screen.getByText("Hello")).toBeInTheDocument(); // Markdown rendered
  });

  // ------ Test 3️⃣ ------
  it("renders LoadingAnimation when isExpLoading is true", () => {
    (useExplanation as jest.Mock).mockReturnValue({
      handleExplanation,
      isExpLoading: true,
      explanationError: "",
      setExplanationError: jest.fn(),
    });

    render(<ExplanationSection explanation="" mounted={true} ready={true} />);
    expect(screen.getByText("LoadingAnimation")).toBeInTheDocument();
  });

  // ------ Test 4️⃣ ------
  it("renders AI explanation button when no error, no explanation, and not loading", () => {
    render(<ExplanationSection explanation="" mounted={true} ready={true} />);
    const button = screen.getByText("✨ AI explanations");
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(handleExplanation).toHaveBeenCalled();
  });

  // ------ Test 5️⃣ ------
  it("applies correct classes when mounted and ready are false", () => {
    const { container } = render(<ExplanationSection explanation="" mounted={false} ready={false} />);
    expect(container.querySelector("div > button")?.parentElement).toHaveClass("scale-x-0 opacity-0");
  });

  // ------ Test 6️⃣ ------
  it("applies correct classes when mounted is true but ready is false", () => {
    const { container } = render(<ExplanationSection explanation="" mounted={true} ready={false} />);
    expect(container.querySelector("div > button")?.parentElement).toHaveClass("delay-1000 scale-x-100 opacity-100");
  });
});

/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ExplanationLanguage from "@/components/menu/ExplanationLanguage";
import { useExplanationLanguage } from "@/lib/client/hooks/explanation/useExplanationLanguage";
import { getSortedLanguageCodes } from "@/lib/client/utils/language/sortedLanguageCodes";
import ISO6391 from "iso-639-1";

// ------ Mocks ------
jest.mock("@/lib/client/hooks/explanation/useExplanationLanguage");
jest.mock("@/lib/client/utils/language/sortedLanguageCodes");
jest.mock("iso-639-1", () => ({
  getName: jest.fn(),
}));

describe("ExplanationLanguage component", () => {
  const changeSystemLang = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useExplanationLanguage as jest.Mock).mockReturnValue({
      systemLang: "en",
      changeSystemLang,
    });
    (getSortedLanguageCodes as jest.Mock).mockReturnValue(["en", "fr", "es"]);
    (ISO6391.getName as jest.Mock).mockImplementation(code => {
      const names: Record<string, string> = { en: "English", fr: "French", es: "Spanish" };
      return names[code] || code;
    });
  });

  // ------ Test 1️⃣ ------
  it("renders header and all language options", () => {
    render(<ExplanationLanguage showMenu={true} />);

    expect(screen.getByText("Explanation Language")).toBeInTheDocument();
    expect(screen.getByText("English (EN)")).toBeInTheDocument();
    expect(screen.getByText("French (FR)")).toBeInTheDocument();
    expect(screen.getByText("Spanish (ES)")).toBeInTheDocument();
  });

  // ------ Test 2️⃣ ------
  it("applies opacity-0 when showMenu is false", () => {
    const { container } = render(<ExplanationLanguage showMenu={false} />);
    expect(container.firstChild).toHaveClass("opacity-0");
  });

  // ------ Test 3️⃣ ------
  it("calls changeSystemLang when a language is clicked", () => {
    render(<ExplanationLanguage showMenu={true} />);
    const frenchOption = screen.getByText("French (FR)");
    fireEvent.click(frenchOption);
    expect(changeSystemLang).toHaveBeenCalledWith("fr");
  });

  // ------ Test 4️⃣ ------
  it("shows check icon for currently selected language", () => {
    render(<ExplanationLanguage showMenu={true} />);
    const englishOption = screen.getByText("English (EN)");
    expect(englishOption.parentElement?.querySelector("svg")).toBeInTheDocument();
  });

  // ------ Test 5️⃣ ------
  it("does not show check icon for unselected languages", () => {
    render(<ExplanationLanguage showMenu={true} />);
    const frenchOption = screen.getByText("French (FR)");
    const svg = frenchOption.parentElement?.querySelector("svg");
    expect(svg).toBeNull(); // Svg should not exist for unselected language
  });

  // ------ Test 6️⃣ ------
  it("renders code fallback when ISO6391.getName returns empty", () => {
    // Spy and override getName just for this test
    const spyGetName = jest.spyOn(ISO6391, "getName").mockImplementation(code => {
      if (code === "xx") return ""; // simulate missing name
      const names: Record<string, string> = { en: "English", fr: "French", es: "Spanish" };
      return names[code] || code;
    });

    (useExplanationLanguage as jest.Mock).mockReturnValue({
      systemLang: "fr",
      changeSystemLang: jest.fn(),
    });

    (getSortedLanguageCodes as jest.Mock).mockReturnValue(["fr", "xx"]); // include unknown code

    render(<ExplanationLanguage showMenu={true} />);

    expect(screen.getByText("French (FR)")).toBeInTheDocument();
    expect(screen.getByText("xx (XX)")).toBeInTheDocument();

    // Restore original implementation
    spyGetName.mockRestore();
  });
});

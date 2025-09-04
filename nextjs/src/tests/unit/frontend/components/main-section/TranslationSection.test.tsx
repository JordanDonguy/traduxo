/**
 * @jest-environment jsdom
 */

import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import TranslationSection from "@/components/main-section/TranslationSection";
import { TranslationItem } from "../../../../../../types/translation";

// --------- Mock lucide-react Star icon ---------
jest.mock("lucide-react", () => ({
  Star: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="star-icon" {...props} />,
}));

describe("<TranslationSection />", () => {
  const mockFavoriteClick = jest.fn();
  const mockSwitchTranslations = jest.fn();

  // Utility to create TranslationItem array
  const makeTranslatedText = (values: string[], mainIdx = 1): TranslationItem[] => {
    return values.map((v, i) => ({
      value: v,
      type: i === 0
        ? "expression"
        : i === mainIdx
          ? "main_translation"
          : "alternative",
    }));
  };

  const defaultTranslatedText = makeTranslatedText(["hello", "world", "alternative1", "alternative2"]);

  const defaultProps = {
    translatedText: defaultTranslatedText,
    inputTextLang: "en",
    translatedTextLang: "fr",
    fading: [],
    isFavorite: false,
    isFavLoading: false,
    onFavoriteClick: mockFavoriteClick,
    onSwitchTranslations: mockSwitchTranslations,
    children: <div>ChildrenSlot</div>,
  };

  // ------ Test 1️⃣ ------
  it("renders input language and first translated text", () => {
    render(<TranslationSection {...defaultProps} />);
    expect(screen.getByText("EN")).toBeInTheDocument();
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  // ------ Test 2️⃣ ------
  it("renders output language and main translation", () => {
    render(<TranslationSection {...defaultProps} />);
    expect(screen.getByText("FR")).toBeInTheDocument();
    expect(screen.getByText("World")).toBeInTheDocument();
  });

  // ------ Test 3️⃣ ------
  it("renders alternative translations and calls onSwitchTranslations on click", () => {
    render(<TranslationSection {...defaultProps} />);
    const alt1 = screen.getByText("Alternative1");
    const alt2 = screen.getByText("Alternative2");

    expect(alt1).toBeInTheDocument();
    expect(alt2).toBeInTheDocument();

    fireEvent.click(alt1);
    expect(mockSwitchTranslations).toHaveBeenCalledWith("alternative1");

    fireEvent.click(alt2);
    expect(mockSwitchTranslations).toHaveBeenCalledWith("alternative2");
  });

  // ------ Test 4️⃣ ------
  it("renders children slot", () => {
    render(<TranslationSection {...defaultProps} />);
    expect(screen.getByText("ChildrenSlot")).toBeInTheDocument();
  });

  // ------ Test 5️⃣ ------
  it("calls onFavoriteClick when favorite button is clicked", () => {
    render(<TranslationSection {...defaultProps} />);
    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(mockFavoriteClick).toHaveBeenCalled();
  });

  // ------ Test 6️⃣ ------
  it("disables favorite button when isFavLoading is true", () => {
    render(<TranslationSection {...defaultProps} isFavLoading={true} />);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  // ------ Test 7️⃣ ------
  it("applies fading class to main and alternative translations", () => {
    render(
      <TranslationSection
        {...defaultProps}
        fading={["world", "alternative1"]} // use lowercase 'world', exact value
      />
    );

    // Main translation should have scale-y-0
    expect(screen.getByText("World")).toHaveClass("scale-y-0");

    // First alternative should have scale-y-0
    expect(screen.getByText("Alternative1")).toHaveClass("scale-y-0");

    // Second alternative should remain scale-y-100
    expect(screen.getByText("Alternative2")).toHaveClass("scale-y-100");
  });


  // ------ Test 8️⃣ ------
  it("capitalizes translated text and alternative translations", () => {
    render(<TranslationSection {...defaultProps} />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("World")).toBeInTheDocument();
    expect(screen.getByText("Alternative1")).toBeInTheDocument();
    expect(screen.getByText("Alternative2")).toBeInTheDocument();
  });

  // ------ Test 9️⃣ ------
  it("does not render alternative translations shorter than 3 characters", () => {
    render(
      <TranslationSection
        {...defaultProps}
        translatedText={makeTranslatedText(["hello", "world", "a", "ab"])}
      />
    );
    expect(screen.queryByText("a")).not.toBeInTheDocument();
    expect(screen.queryByText("ab")).not.toBeInTheDocument();
  });

  // ------ Test 🔟 ------
  it("returns empty string when capitalizeFirstLetter is called with empty string", () => {
    render(
      <TranslationSection
        {...defaultProps}
        translatedText={makeTranslatedText(["", ""])}
      >
        ChildrenSlot
      </TranslationSection>
    );

    // Query only the paragraphs for main and first alt translations
    const paragraphs = screen.getAllByText((content, element) => {
      if (!(element instanceof HTMLElement)) return false; // only check HTMLElements
      return element.className.includes("text-xl") && content === "";
    });

    expect(paragraphs).toHaveLength(2); // main + first alt
  });

  // ------ Test 1️⃣1️⃣ ------
  it("renders empty string when inputTextLang length > 2", () => {
    render(
      <TranslationSection
        translatedText={makeTranslatedText(["hello", "world"])}
        inputTextLang="eng"
        translatedTextLang="fr"
        fading={[]}
        isFavorite={false}
        isFavLoading={false}
        onFavoriteClick={() => { }}
        onSwitchTranslations={() => { }}
      />
    );

    const langP = screen.getByText("", { selector: "p" });
    expect(langP).toBeInTheDocument();
  });

  // ------ Test 1️⃣2️⃣ ------
  it("renders uppercase inputTextLang when length <= 2", () => {
    render(
      <TranslationSection
        translatedText={makeTranslatedText(["hello", "world"])}
        inputTextLang="en"
        translatedTextLang="fr"
        fading={[]}
        isFavorite={false}
        isFavLoading={false}
        onFavoriteClick={() => { }}
        onSwitchTranslations={() => { }}
      />
    );

    expect(screen.getByText("EN")).toBeInTheDocument();
  });

  // ------ Test 1️⃣3️⃣ ------
  it("renders empty string if translatedTextLang length > 2", () => {
    render(
      <TranslationSection
        translatedText={makeTranslatedText(["hello", "bonjour"])}
        inputTextLang="en"
        translatedTextLang="eng"
        fading={[]}
        isFavorite={false}
        isFavLoading={false}
        onFavoriteClick={() => { }}
        onSwitchTranslations={() => { }}
      />
    );

    // The language <p> should render nothing
    const langP = screen.getByText("", { selector: "p" });
    expect(langP).toBeInTheDocument();
  });

  // ------ Test 1️⃣4️⃣ ------
  it("renders Star with transparent fill when not favorite", () => {
    render(
      <TranslationSection
        translatedText={makeTranslatedText(["hello", "bonjour"])}
        inputTextLang="en"
        translatedTextLang="fr"
        fading={[]}
        isFavorite={false}
        isFavLoading={false}
        onFavoriteClick={() => { }}
        onSwitchTranslations={() => { }}
      />
    );

    // Find the Star icon and check fill
    const starIcon = screen.getByTestId("star-icon");
    expect(starIcon).toHaveAttribute("fill", "transparent");
  });

  // ------ Test 1️⃣5️⃣ ------
  it("renders Star with currentColor fill when favorite", () => {
    render(
      <TranslationSection
        translatedText={makeTranslatedText(["hello", "bonjour"])}
        inputTextLang="en"
        translatedTextLang="fr"
        fading={[]}
        isFavorite={true}
        isFavLoading={false}
        onFavoriteClick={() => { }}
        onSwitchTranslations={() => { }}
      />
    );

    const starIcon = screen.getByTestId("star-icon");
    expect(starIcon).toHaveAttribute("fill", "currentColor");
  });
});

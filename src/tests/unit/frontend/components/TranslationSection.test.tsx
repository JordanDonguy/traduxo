/**
 * @jest-environment jsdom
 */

import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import TranslationSection from "@/components/TranslationSection";

// --------- Mock lucide-react Star icon ---------
jest.mock("lucide-react", () => ({
  Star: (props: React.SVGProps<SVGSVGElement>) => <svg data-testid="star-icon" {...props} />,
}));


describe("<TranslationSection />", () => {
  const mockFavoriteClick = jest.fn();
  const mockSwitchTranslations = jest.fn();

  const defaultProps = {
    translatedText: ["hello", "world", "alternative1", "alternative2"],
    inputTextLang: "en",
    translatedTextLang: "fr",
    fading: [],
    mounted: true,
    ready: true,
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
    expect(mockSwitchTranslations).toHaveBeenCalledWith(0);

    fireEvent.click(alt2);
    expect(mockSwitchTranslations).toHaveBeenCalledWith(1);
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
        fading={[1, 2]} // fading main and first alternative
      />
    );

    // Main translation should have opacity-0
    expect(screen.getByText("World")).toHaveClass("opacity-0");

    // First alternative should have opacity-0
    expect(screen.getByText("Alternative1")).toHaveClass("opacity-0");

    // Second alternative should remain opacity-100
    expect(screen.getByText("Alternative2")).toHaveClass("opacity-100");
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
        translatedText={["hello", "world", "a", "ab"]}
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
        translatedText={["", ""]}
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
  it("applies -translate-x-full opacity-0 when mounted is false", () => {
    render(
      <TranslationSection
        {...defaultProps}
        mounted={false}
      />
    );

    // First article (input language + original text)
    const inputArticle = screen.getByText("EN").closest("article");
    expect(inputArticle).toHaveClass("-translate-x-full opacity-0");

    // Second article (output language + main translation)
    const outputArticle = screen.getByText("World").closest("article");
    expect(outputArticle).toHaveClass("-translate-x-full opacity-0");
  });

  // ------ Test 1️⃣2️⃣ ------
  it("applies delay-500 translate-x-0 opacity-100 when mounted is true but ready is false", () => {
    render(
      <TranslationSection
        {...defaultProps}
        mounted={true}
        ready={false}
      />
    );

    const outputArticle = screen.getByText("World").closest("article");
    expect(outputArticle).toHaveClass("delay-500 translate-x-0 opacity-100");
  });

  // ------ Test 1️⃣3️⃣ ------
  it("renders empty string when inputTextLang length > 2", () => {
    render(
      <TranslationSection
        translatedText={["hello", "world"]}
        inputTextLang="eng"       // length > 2
        translatedTextLang="fr"
        fading={[]}
        mounted={true}
        ready={true}
        isFavorite={false}
        isFavLoading={false}
        onFavoriteClick={() => { }}
        onSwitchTranslations={() => { }}
      />
    );

    const langP = screen.getByText("", { selector: "p" }); // selects <p> with empty string
    expect(langP).toBeInTheDocument();
  });

  // ------ Test 1️⃣4️⃣ ------
  it("renders uppercase inputTextLang when length <= 2", () => {
    render(
      <TranslationSection
        translatedText={["hello", "world"]}
        inputTextLang="en"        // length <= 2
        translatedTextLang="fr"
        fading={[]}
        mounted={true}
        ready={true}
        isFavorite={false}
        isFavLoading={false}
        onFavoriteClick={() => { }}
        onSwitchTranslations={() => { }}
      />
    );

    expect(screen.getByText("EN")).toBeInTheDocument();
  });

  // ------ Test 1️⃣5️⃣ ------
  it("renders empty string if translatedTextLang length > 2", () => {
    render(
      <TranslationSection
        translatedText={["hello", "bonjour"]}
        inputTextLang="en"
        translatedTextLang="eng" // length > 2
        fading={[]}
        mounted={true}
        ready={true}
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

  // ------ Test 1️⃣6️⃣ ------
  it("renders Star with transparent fill when not favorite", () => {
    render(
      <TranslationSection
        translatedText={["hello", "bonjour"]}
        inputTextLang="en"
        translatedTextLang="fr"
        fading={[]}
        mounted={true}
        ready={true}
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

  // ------ Test 1️⃣7️⃣ ------
  it("renders Star with currentColor fill when favorite", () => {
    render(
      <TranslationSection
        translatedText={["hello", "bonjour"]}
        inputTextLang="en"
        translatedTextLang="fr"
        fading={[]}
        mounted={true}
        ready={true}
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

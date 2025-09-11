/**
 * @jest-environment jsdom
 */

import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import MainDisplay from "@/components/main-section/MainDisplay";

// --------- Mock contexts ---------
// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// Mock AppContext
jest.mock("@traduxo/packages/contexts/AppContext", () => ({
  useApp: jest.fn(),
}));

// Mock TranslationContext
jest.mock("@traduxo/packages/contexts/TranslationContext", () => ({
  useTranslationContext: jest.fn(),
}));

// --------- Mock hooks ---------
// Favorite toggle hook
jest.mock("@/lib/client/hooks/favorites/useFavoriteToggle", () => ({
  useFavoriteToggle: () => ({
    handleFavorite: jest.fn(),
    isFavLoading: false,
  }),
}));

// Switch translations hook
jest.mock("@/lib/client/hooks/translation/useSwitchTranslations", () => ({
  useSwitchTranslations: () => ({
    switchTranslations: jest.fn(),
    fading: false,
  }),
}));

// --------- Mock child components ---------
// Error Section
jest.mock("@/components/main-section/ErrorSection", () => {
  const Component = () => <div>ErrorSection</div>;
  Component.displayName = "ErrorSection";
  return Component;
});

// Loading Animation
jest.mock("@/components/main-section/LoadingAnimation", () => {
  const Component = () => <div>LoadingAnimation</div>;
  Component.displayName = "LoadingAnimation";
  return Component;
});

// Landing Display
jest.mock("@/components/main-section/LandingDisplay", () => {
  const Component = () => <div>LandingDisplay</div>;
  Component.displayName = "LandingDisplay";
  return Component;
});

// Translation Section (renders children)
jest.mock("@/components/main-section/TranslationSection", () => {
  const Component = (props: React.PropsWithChildren) => (
    <div>
      TranslationSection
      {props.children}
    </div>
  );
  Component.displayName = "TranslationSection";
  return Component;
});

// Explanation Section (renders explanation text inside <p>)
jest.mock("@/components/main-section/ExplanationSection", () => {
  const Component = (props: React.PropsWithChildren<{ explanation: string }>) => (
    <div>
      ExplanationSection
      <p>{props.explanation}</p>
    </div>
  );
  Component.displayName = "ExplanationSection";
  return Component;
});

// ---- Import Contexts ----
import { useApp } from "@traduxo/packages/contexts/AppContext";
import { useTranslationContext } from "@traduxo/packages/contexts/TranslationContext";

// ---- Tests ----
describe("<MainDisplay />", () => {
  // ------ Test 1️⃣ ------
  it("renders ErrorSection when error exists", () => {
    (useApp as jest.Mock).mockReturnValue({
      isLoading: false,
      error: "Something went wrong",
      setError: jest.fn(),
    });
    (useTranslationContext as jest.Mock).mockReturnValue({
      translatedText: "",
      setTranslatedText: jest.fn(),
      inputTextLang: "en",
      translatedTextLang: "fr",
      explanation: "",
      isFavorite: false,
    });

    render(<MainDisplay />);
    expect(screen.getByText("ErrorSection")).toBeInTheDocument();
  });

  // ------ Test 2️⃣ ------
  it("renders LoadingAnimation when isLoading is true", () => {
    (useApp as jest.Mock).mockReturnValue({
      isLoading: true,
      error: "",
      setError: jest.fn(),
    });
    (useTranslationContext as jest.Mock).mockReturnValue({
      translatedText: "",
      setTranslatedText: jest.fn(),
      inputTextLang: "en",
      translatedTextLang: "fr",
      explanation: "",
      isFavorite: false,
    });

    render(<MainDisplay />);
    expect(screen.getByText("LoadingAnimation")).toBeInTheDocument();
  });

  // ------ Test 3️⃣ ------
  it("renders LandingDisplay when there is no translated text", () => {
    (useApp as jest.Mock).mockReturnValue({
      isLoading: false,
      error: "",
      setError: jest.fn(),
    });
    (useTranslationContext as jest.Mock).mockReturnValue({
      translatedText: "",
      setTranslatedText: jest.fn(),
      inputTextLang: "en",
      translatedTextLang: "fr",
      explanation: "",
      isFavorite: false,
    });

    render(<MainDisplay />);
    expect(screen.getByText("LandingDisplay")).toBeInTheDocument();
  });

  // ------ Test 4️⃣ ------
  it("renders TranslationSection + ExplanationSection when translated text exists", () => {
    (useApp as jest.Mock).mockReturnValue({
      isLoading: false,
      error: "",
      setError: jest.fn(),
    });
    (useTranslationContext as jest.Mock).mockReturnValue({
      translatedText: "Hello world",
      setTranslatedText: jest.fn(),
      inputTextLang: "en",
      translatedTextLang: "fr",
      explanation: "Some explanation",
      isFavorite: false,
    });

    render(<MainDisplay />);
    expect(screen.getByText("TranslationSection")).toBeInTheDocument();
    expect(screen.getByText("ExplanationSection")).toBeInTheDocument();
  });

  // ------ Test 5️⃣ ------
  it("replaces quotes with <strong> in paragraph innerHTML", () => {
    const explanationText = 'This is a "test" and «exemple»';

    (useApp as jest.Mock).mockReturnValue({
      isLoading: false,
      error: "",
      setError: jest.fn(),
    });
    (useTranslationContext as jest.Mock).mockReturnValue({
      translatedText: "Hello",
      setTranslatedText: jest.fn(),
      inputTextLang: "en",
      translatedTextLang: "fr",
      explanation: explanationText,
      isFavorite: false,
    });

    render(<MainDisplay />);

    // Check that the paragraph innerHTML has <strong> tags
    const paragraph = document.querySelector("p");
    expect(paragraph).not.toBeNull();
    expect(paragraph?.innerHTML).toContain('<strong>test</strong>');
    expect(paragraph?.innerHTML).toContain('<strong>exemple</strong>');
  });

  // ------ Test 6️⃣ ------
  it("applies different bottom margin classes depending on explanation length", () => {
    (useApp as jest.Mock).mockReturnValue({
      isLoading: false,
      error: "",
      setError: jest.fn(),
    });

    // Case 1: short explanation
    (useTranslationContext as jest.Mock).mockReturnValue({
      translatedText: "Hello",
      setTranslatedText: jest.fn(),
      inputTextLang: "en",
      translatedTextLang: "fr",
      explanation: "Short explanation", // length < 500
      isFavorite: false,
    });

    const { rerender, container } = render(<MainDisplay />);
    let section = container.querySelector("section");
    expect(section).toHaveClass("mb-52 lg:mb-68");

    // Case 2: long explanation
    const longExplanation = "A".repeat(501);
    (useTranslationContext as jest.Mock).mockReturnValue({
      translatedText: "Hello",
      setTranslatedText: jest.fn(),
      inputTextLang: "en",
      translatedTextLang: "fr",
      explanation: longExplanation,
      isFavorite: false,
    });

    rerender(<MainDisplay />);
    section = container.querySelector("section");
    expect(section).toHaveClass("mb-40 lg:mb-56");
  });
});

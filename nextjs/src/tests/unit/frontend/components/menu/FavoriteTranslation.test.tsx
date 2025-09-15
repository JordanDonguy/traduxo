/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import FavoriteTranslation from "@/components/menu/FavoriteTranslations";
import { useFavoriteTranslations } from "@traduxo/packages/hooks/favorites/useFavoriteTranslations";
import { useSelectTranslation } from "@traduxo/packages/hooks/translation/useSelectTranslation";

// --- Mocks ---
jest.mock("@traduxo/packages/hooks/favorites/useFavoriteTranslations");

jest.mock("@traduxo/packages/hooks/translation/useSelectTranslation");

jest.mock("lucide-react", () => ({
  CircleX: () => <svg data-testid="circle-x" />,
}));

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));


// ---- Tests ----
describe("FavoriteTranslation component", () => {
  const deleteTranslation = jest.fn();
  const selectTranslation = jest.fn();

  beforeEach(() => {
    (useFavoriteTranslations as jest.Mock).mockReturnValue({
      favoriteTranslations: [
        { id: 1, inputLang: "en", inputText: "Hello", outputLang: "fr", translation: "Bonjour" },
        { id: 2, inputLang: "fr", inputText: "Salut", outputLang: "en", translation: "Hi" },
      ],
      isLoading: false,
      status: "authenticated",
      deleteTranslation,
    });

    (useSelectTranslation as jest.Mock).mockReturnValue({ selectTranslation });
  });

  // ------ Test 1️⃣ ------
  it("renders header and translations", () => {
    render(<FavoriteTranslation showMenu={true} />);
    expect(screen.getByText("Favorites")).toBeInTheDocument();
    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("Bonjour")).toBeInTheDocument();
    expect(screen.getByText("Salut")).toBeInTheDocument();
    expect(screen.getByText("Hi")).toBeInTheDocument();
  });

  // ------ Test 2️⃣ ------
  it("applies opacity-0 when showMenu is false", () => {
    const { container } = render(<FavoriteTranslation showMenu={false} />);
    expect(container.firstChild).toHaveClass("opacity-0");
  });

  // ------ Test 3️⃣ ------
  it("calls selectTranslation when translation clicked", () => {
    render(<FavoriteTranslation showMenu={true} />);
    const article = screen.getByText("Hello").closest("article");
    fireEvent.click(article!);
    expect(selectTranslation).toHaveBeenCalledWith(
      { id: 1, inputLang: "en", inputText: "Hello", outputLang: "fr", translation: "Bonjour" },
      true
    );
  });

  // ------ Test 4️⃣ ------
  it("calls deleteTranslation when delete button clicked", () => {
    render(<FavoriteTranslation showMenu={true} />);
    const deleteBtn = screen.getAllByTestId("circle-x")[0];
    fireEvent.click(deleteBtn);
    expect(deleteTranslation).toHaveBeenCalledWith(1);
  });

  // ------ Test 5️⃣ ------
  it("shows spinner when loading", () => {
    (useFavoriteTranslations as jest.Mock).mockReturnValue({
      favoriteTranslations: [],
      isLoading: true,
      status: "authenticated",
      deleteTranslation,
    });

    render(<FavoriteTranslation showMenu={true} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  // ------ Test 6️⃣ ------
  it("shows empty message when no favorites", () => {
    (useFavoriteTranslations as jest.Mock).mockReturnValue({
      favoriteTranslations: [],
      isLoading: false,
      status: "authenticated",
      deleteTranslation,
    });

    render(<FavoriteTranslation showMenu={true} />);
    expect(screen.getByText("No favorite translations found...")).toBeInTheDocument();
  });

  // ------ Test 7️⃣ ------
  it("shows login message when not authenticated", () => {
    (useFavoriteTranslations as jest.Mock).mockReturnValue({
      favoriteTranslations: [],
      isLoading: false,
      status: "unauthenticated",
      deleteTranslation,
    });

    render(<FavoriteTranslation showMenu={true} />);
    expect(
      screen.getByText("You need to log in to have access to your favorite translations")
    ).toBeInTheDocument();
  });

  // ------ Test 8️⃣ ------
  it("renders the correct language codes", () => {
    render(<FavoriteTranslation showMenu={true} />);

    const inputLangSpans = screen.getAllByText(/EN|FR/);
    expect(inputLangSpans[0]).toHaveTextContent("EN"); // first translation input
    expect(inputLangSpans[1]).toHaveTextContent("FR"); // first translation output
    expect(inputLangSpans[2]).toHaveTextContent("FR"); // second translation input
    expect(inputLangSpans[3]).toHaveTextContent("EN"); // second translation output
  });

  it("navigates to / if deleteTranslation fails", async () => {
    // Arrange deleteTranslation to returns false
    (useFavoriteTranslations as jest.Mock).mockReturnValue({
      favoriteTranslations: [
        { id: 1, inputLang: "en", inputText: "Hello", outputLang: "fr", translation: "Bonjour" },
      ],
      isLoading: false,
      status: "authenticated",
      deleteTranslation: jest.fn().mockResolvedValue(false),
    });

    render(<FavoriteTranslation showMenu={true} />);
    const deleteBtn = screen.getByTestId("circle-x");

    // Act: click delete button
    fireEvent.click(deleteBtn);

    // Wait for 
    await screen.findByText("Favorites"); // just to wait for component update

    // Assert: router.push called
    expect(mockPush).toHaveBeenCalledWith("/");
  });
});

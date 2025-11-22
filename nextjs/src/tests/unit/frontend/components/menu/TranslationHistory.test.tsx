/**
 * @jest-environment jsdom
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import TranslationHistory from "@/components/menu/TranslationHistory";

// ---- Mocks ----
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@traduxo/packages/contexts/AppContext", () => ({
  useApp: () => ({ setError: jest.fn() }),
}));

jest.mock("@traduxo/packages/contexts/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@traduxo/packages/hooks/history/useTranslationHistory", () => ({
  useTranslationHistory: jest.fn(),
}));

jest.mock("@traduxo/packages/hooks/translation/useSelectTranslation", () => ({
  useSelectTranslation: jest.fn(),
}));

jest.mock("lucide-react", () => ({
  CircleX: (props: any) => <div {...props}>CircleXIcon</div>,
}));

// ---- Import mocked hooks ----
import { useAuth } from "@traduxo/packages/contexts/AuthContext";
import { useTranslationHistory } from "@traduxo/packages/hooks/history/useTranslationHistory";
import { useSelectTranslation } from "@traduxo/packages/hooks/translation/useSelectTranslation";
import { toast } from "react-toastify";

jest.mock("react-toastify", () => ({
  toast: { error: jest.fn() },
}));

describe("<TranslationHistory />", () => {
  const mockDeleteTranslation = jest.fn();
  const mockSelectTranslation = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    (useAuth as jest.Mock).mockReturnValue({ status: "authenticated" });
    (useSelectTranslation as jest.Mock).mockReturnValue({
      selectTranslation: mockSelectTranslation,
    });
    (useTranslationHistory as jest.Mock).mockReturnValue({
      translationHistory: [],
      isLoading: false,
      deleteTranslation: mockDeleteTranslation,
    });
  });

  // ------ Test 1️⃣ ------
  it("applies opacity classes correctly", () => {
    const { rerender, container } = render(<TranslationHistory showMenu={true} />);
    expect(container.firstChild).toHaveClass("opacity-100");

    rerender(<TranslationHistory showMenu={false} />);
    expect(container.firstChild).toHaveClass("opacity-0");
  });

  // ------ Test 2️⃣ ------
  it("renders translation items when history is present", () => {
    const history = [
      { id: "1", inputLang: "en", inputText: "Hello", outputLang: "fr", translation: "Bonjour" },
      { id: "2", inputLang: "es", inputText: "Hola", outputLang: "en", translation: "Hi" },
    ];

    (useTranslationHistory as jest.Mock).mockReturnValue({
      translationHistory: history,
      isLoading: false,
      deleteTranslation: mockDeleteTranslation,
    });

    render(<TranslationHistory showMenu={true} />);

    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("Bonjour")).toBeInTheDocument();
    expect(screen.getByText("Hola")).toBeInTheDocument();
    expect(screen.getByText("Hi")).toBeInTheDocument();
  });

  // ------ Test 3️⃣ ------
  it("calls selectTranslation when a history item is clicked", () => {
    const history = [{ id: "1", inputLang: "en", inputText: "Hello", outputLang: "fr", translation: "Bonjour" }];
    (useTranslationHistory as jest.Mock).mockReturnValue({
      translationHistory: history,
      isLoading: false,
      deleteTranslation: mockDeleteTranslation,
    });

    render(<TranslationHistory showMenu={true} />);
    const article = screen.getByText("Hello").closest("article")!;
    fireEvent.click(article);

    expect(mockSelectTranslation).toHaveBeenCalledWith(history[0], false);
  });

  // ------ Test 4️⃣ ------
  it("calls deleteTranslation when delete button is clicked and does not trigger selectTranslation", async () => {
    const history = [{ id: "1", inputLang: "en", inputText: "Hello", outputLang: "fr", translation: "Bonjour" }];
    (useTranslationHistory as jest.Mock).mockReturnValue({
      translationHistory: history,
      isLoading: false,
      deleteTranslation: mockDeleteTranslation.mockResolvedValue({ success: true }),
    });

    render(<TranslationHistory showMenu={true} />);
    const deleteBtn = screen.getByLabelText("Delete history translation 1");
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(mockDeleteTranslation).toHaveBeenCalledWith("1");
      expect(mockSelectTranslation).not.toHaveBeenCalled();
    });
  });

  // ------ Test 5️⃣ ------
  it("shows login message when user is not authenticated", () => {
    (useAuth as jest.Mock).mockReturnValue({ status: "unauthenticated" });

    render(<TranslationHistory showMenu={true} />);
    expect(screen.getByText("You need to log in to have access to your translation history")).toBeInTheDocument();
  });

  // ------ Test 6️⃣ ------
  it("shows empty history message when authenticated but history is empty", () => {
    (useTranslationHistory as jest.Mock).mockReturnValue({
      translationHistory: [],
      isLoading: false,
      deleteTranslation: mockDeleteTranslation,
    });

    render(<TranslationHistory showMenu={true} />);
    expect(screen.getByText("No translations found in history...")).toBeInTheDocument();
  });

  // ------ Test 7️⃣ ------
  it("handles deleteTranslation failure by showing toast and redirecting", async () => {
    const history = [{ id: "1", inputLang: "en", inputText: "Hello", outputLang: "fr", translation: "Bonjour" }];
    (useTranslationHistory as jest.Mock).mockReturnValue({
      translationHistory: history,
      isLoading: false,
      deleteTranslation: mockDeleteTranslation.mockResolvedValue({ success: false, message: "Delete failed" }),
    });

    render(<TranslationHistory showMenu={true} />);
    const deleteBtn = screen.getByLabelText("Delete history translation 1");
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Delete failed");
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });
});

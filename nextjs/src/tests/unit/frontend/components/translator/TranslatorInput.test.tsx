/**
 * @jest-environment jsdom
 */

import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import TranslatorInput from "@/components/translator/TranslatorInput";

// --------- Mock contexts/hooks ---------
const mockSetIsLoading = jest.fn();
const mockSetError = jest.fn();

const mockSetInputText = jest.fn();
const mockSetTranslatedText = jest.fn();
const mockSetInputTextLang = jest.fn();
const mockSetTranslatedTextLang = jest.fn();
const mockSetExplanation = jest.fn();
const mockSetIsFavorite = jest.fn();
const mockSetTranslationId = jest.fn();

const mockSetInputLang = jest.fn();
const mockSetOutputLang = jest.fn();

// ---- Mock helpers/hooks ----
jest.mock("@traduxo/packages/contexts/AppContext", () => ({
  useApp: () => ({
    setIsLoading: mockSetIsLoading,
    setError: mockSetError,
  }),
}));

jest.mock("@traduxo/packages/contexts/TranslationContext", () => ({
  useTranslationContext: () => ({
    inputText: "Hello",
    setInputText: mockSetInputText,
    setTranslatedText: mockSetTranslatedText,
    setInputTextLang: mockSetInputTextLang,
    setTranslatedTextLang: mockSetTranslatedTextLang,
    setExplanation: mockSetExplanation,
    setIsFavorite: mockSetIsFavorite,
    setTranslationId: mockSetTranslationId,
  }),
}));

jest.mock("@traduxo/packages/contexts/LanguageContext", () => ({
  useLanguageContext: () => ({
    inputLang: "en",
    outputLang: "fr",
    setInputLang: mockSetInputLang,
    setOutputLang: mockSetOutputLang,
    detectedLang: "en",
  }),
}));

jest.mock("@/lib/client/hooks/ui/useLanguageSwitch", () => ({
  useLanguageSwitch: () => ({
    isSwitching: false,
    switchLanguage: jest.fn(),
  }),
}));

const mockHandleVoice = jest.fn();
jest.mock("@/lib/client/hooks/ui/useVoiceInput", () => ({
  useVoiceInput: () => ({
    isListening: false,
    showWarning: false,
    setShowWarning: jest.fn(),
    handleVoice: mockHandleVoice,
  }),
}));

const mockTranslationHelper = jest.fn();
jest.mock("@/lib/client/utils/translation/translate", () => ({
  translationHelper: (args: Parameters<typeof mockTranslationHelper>[0]) => mockTranslationHelper(args),
}));

// ---- Mock child components ----
// Mock LanguageSelector
jest.mock("@/components/translator/LanguageSelector", () => {
  const MockLanguageSelector = () => <div>LanguageSelector</div>;
  MockLanguageSelector.displayName = "LanguageSelector";
  return MockLanguageSelector;
});

// Mock TextInputForm with proper types
jest.mock("@/components/translator/TextInputForm", () => {
  interface TextInputFormProps {
    handleTranslate: (e: React.FormEvent<HTMLFormElement>) => void;
    handleVoice: () => void;
  }

  const MockTextInputForm = ({ handleTranslate, handleVoice }: TextInputFormProps) => (
    <form data-testid="text-input-form" onSubmit={handleTranslate}>
      <button type="submit">Translate</button>
      <button type="button" onClick={handleVoice}>Voice</button>
    </form>
  );

  MockTextInputForm.displayName = "TextInputForm";
  return MockTextInputForm;
});

// ---- Tests ----
describe("<TranslatorInput />", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ------- Test 1️⃣ -------
  it("renders LanguageSelector and TextInputForm components", () => {
    render(<TranslatorInput />);
    expect(screen.getByText("LanguageSelector")).toBeInTheDocument();
    const form = screen.getByTestId("text-input-form");
    expect(form).toBeInTheDocument();
  });

  // ------- Test 2️⃣ -------
  it("calls translationHelper on form submit", () => {
    render(<TranslatorInput />);
    const form = screen.getByTestId("text-input-form");

    fireEvent.submit(form);

    expect(mockTranslationHelper).toHaveBeenCalledWith({
      inputText: "Hello",
      inputLang: "en",
      outputLang: "fr",
      setInputText: mockSetInputText,
      setInputTextLang: mockSetInputTextLang,
      setTranslatedTextLang: mockSetTranslatedTextLang,
      setTranslatedText: mockSetTranslatedText,
      setExplanation: mockSetExplanation,
      setIsLoading: mockSetIsLoading,
      setIsFavorite: mockSetIsFavorite,
      setTranslationId: mockSetTranslationId,
      setError: mockSetError,
    });
  });

  // ------- Test 3️⃣ -------
  it("calls handleVoice when voice button is clicked", () => {
    render(<TranslatorInput />);
    const voiceButton = screen.getByText("Voice");

    fireEvent.click(voiceButton);
    expect(mockHandleVoice).toHaveBeenCalled();
  });
});

/**
 * @jest-environment jsdom
 */

import React from "react";
import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import TextInputForm from "@/components/TextInputForm";

// ------ Mock lucide-react icons ------
jest.mock("lucide-react", () => ({
  Mic: () => <div>MicIcon</div>,
  CircleStop: () => <div>CircleStopIcon</div>,
}));

describe("<TextInputForm />", () => {
  let setInputText: jest.Mock;
  let handleTranslate: jest.Mock;
  let handleVoice: jest.Mock;

  beforeEach(() => {
    setInputText = jest.fn();
    handleTranslate = jest.fn((e) => e.preventDefault());
    handleVoice = jest.fn();
  });

  // ------ Test 1️⃣ ------
  it("renders input and buttons correctly", () => {
    render(
      <TextInputForm
        inputText=""
        setInputText={setInputText}
        handleTranslate={handleTranslate}
        isListening={false}
        handleVoice={handleVoice}
      />
    );

    expect(screen.getByPlaceholderText("Enter some text...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Translate/i, hidden: true })).toBeInTheDocument();
    expect(screen.getByText("MicIcon")).toBeInTheDocument();
  });

  // ------ Test 2️⃣ ------
  it("calls setInputText on input change", () => {
    render(
      <TextInputForm
        inputText=""
        setInputText={setInputText}
        handleTranslate={handleTranslate}
        isListening={false}
        handleVoice={handleVoice}
      />
    );

    const input = screen.getByPlaceholderText("Enter some text...");
    fireEvent.change(input, { target: { value: "Hello" } });
    expect(setInputText).toHaveBeenCalledWith("Hello");
  });

  // ------ Test 3️⃣ ------
  it("calls handleTranslate on form submit", () => {
    render(
      <TextInputForm
        inputText="Hello"
        setInputText={setInputText}
        handleTranslate={handleTranslate}
        isListening={false}
        handleVoice={handleVoice}
      />
    );

    const form = screen.getByTestId("input-form");
    fireEvent.submit(form);
    expect(handleTranslate).toHaveBeenCalled();
  });

  // ------ Test 4️⃣ ------
  it("calls handleVoice on mic button click", () => {
    render(
      <TextInputForm
        inputText=""
        setInputText={setInputText}
        handleTranslate={handleTranslate}
        isListening={false}
        handleVoice={handleVoice}
      />
    );

    const micButton = screen.getByTestId("mic-button");
    fireEvent.click(micButton);
    expect(handleVoice).toHaveBeenCalled();
  });

  // ------ Test 5️⃣ ------
  it("shows CircleStopIcon when isListening is true", () => {
    render(
      <TextInputForm
        inputText=""
        setInputText={setInputText}
        handleTranslate={handleTranslate}
        isListening={true}
        handleVoice={handleVoice}
      />
    );

    expect(screen.getByText("CircleStopIcon")).toBeInTheDocument();
  });

  // ------ Test 6️⃣ ------
  it("shows max characters warning when input length is 100", () => {
    const longText = "a".repeat(100);

    render(
      <TextInputForm
        inputText={longText}
        setInputText={setInputText}
        handleTranslate={handleTranslate}
        isListening={false}
        handleVoice={handleVoice}
      />
    );

    expect(screen.getByText("100 characters max allowed")).toBeInTheDocument();
  });
});

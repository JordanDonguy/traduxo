/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen, fireEvent, within } from "@testing-library/react";
import LanguageSelector from "@/components/translator/LanguageSelector";
import ISO6391 from "iso-639-1";
import { LanguageCode } from "iso-639-1";

jest.mock("iso-639-1", () => ({
  getAllCodes: jest.fn().mockReturnValue(["en", "fr", "es"]),
  getName: jest.fn((code: "en" | "fr" | "es") => ({ en: "English", fr: "French", es: "Spanish" }[code])),
}));

jest.mock("lucide-react", () => ({
  ArrowRightLeft: () => <svg data-testid="arrow-icon" />,
}));

describe("LanguageSelector component", () => {
  const setInputLang = jest.fn();
  const setOutputLang = jest.fn();
  const switchLanguage = jest.fn();
  const setShowWarning = jest.fn();

  // ------ Test 1️⃣ -------
  it("renders selects and invert button", () => {
    render(
      <LanguageSelector
        inputLang="en"
        outputLang="fr"
        setInputLang={setInputLang}
        setOutputLang={setOutputLang}
        isSwitching={false}
        switchLanguage={switchLanguage}
        showWarning={false}
        setShowWarning={setShowWarning}
      />
    );

    // Select elements
    const inputSelect = screen.getByTestId("input-lang-select");
    const outputSelect = screen.getByTestId("output-lang-select");

    expect(inputSelect).toBeInTheDocument();
    expect(outputSelect).toBeInTheDocument();

    // Invert button
    const invertBtn = screen.getByRole("button");
    expect(invertBtn).toBeInTheDocument();

    // Check options inside input select
    expect(within(inputSelect).getByText("English")).toBeInTheDocument();
    expect(within(inputSelect).getByText("French")).toBeInTheDocument();
    expect(within(inputSelect).getByText("Spanish")).toBeInTheDocument();

    // Check options inside output select
    expect(within(outputSelect).getByText("English")).toBeInTheDocument();
    expect(within(outputSelect).getByText("French")).toBeInTheDocument();
    expect(within(outputSelect).getByText("Spanish")).toBeInTheDocument();
  });

  // ------ Test 2️⃣ -------
  it("calls setInputLang when input select changes", () => {
    render(
      <LanguageSelector
        inputLang="en"
        outputLang="fr"
        setInputLang={setInputLang}
        setOutputLang={setOutputLang}
        isSwitching={false}
        switchLanguage={switchLanguage}
        showWarning={false}
        setShowWarning={setShowWarning}
      />
    );

    const inputSelect = screen.getByTestId("input-lang-select");
    fireEvent.change(inputSelect, { target: { value: "fr" } });
    expect(setInputLang).toHaveBeenCalledWith("fr");
  });

  // ------ Test 3️⃣ -------
  it("calls setOutputLang when output select changes", () => {
    render(
      <LanguageSelector
        inputLang="en"
        outputLang="fr"
        setInputLang={setInputLang}
        setOutputLang={setOutputLang}
        isSwitching={false}
        switchLanguage={switchLanguage}
        showWarning={false}
        setShowWarning={setShowWarning}
      />
    );

    const outputSelect = screen.getByTestId("output-lang-select");
    fireEvent.change(outputSelect, { target: { value: "es" } });
    expect(setOutputLang).toHaveBeenCalledWith("es");
  });

  // ------ Test 4️⃣ -------
  it("calls switchLanguage when invert button clicked", () => {
    render(
      <LanguageSelector
        inputLang="en"
        outputLang="fr"
        setInputLang={setInputLang}
        setOutputLang={setOutputLang}
        isSwitching={false}
        switchLanguage={switchLanguage}
        showWarning={false}
        setShowWarning={setShowWarning}
      />
    );

    const invertBtn = screen.getByRole("button");
    fireEvent.click(invertBtn);
    expect(switchLanguage).toHaveBeenCalled();
  });

  // ------ Test 5️⃣ -------
  it("shows and hides warning based on showWarning prop", () => {
    const { rerender } = render(
      <LanguageSelector
        inputLang="en"
        outputLang="fr"
        setInputLang={setInputLang}
        setOutputLang={setOutputLang}
        isSwitching={false}
        switchLanguage={switchLanguage}
        showWarning={false}
        setShowWarning={setShowWarning}
      />
    );

    const warningBox = screen.getByText(/You need to select a language to use voice input/i).parentElement!;
    expect(warningBox).toHaveClass("scale-y-0");
    expect(warningBox).toHaveClass("opacity-0");

    // Show warning
    rerender(
      <LanguageSelector
        inputLang="en"
        outputLang="fr"
        setInputLang={setInputLang}
        setOutputLang={setOutputLang}
        isSwitching={false}
        switchLanguage={switchLanguage}
        showWarning={true}
        setShowWarning={setShowWarning}
      />
    );

    expect(warningBox).toHaveClass("scale-y-100");
    expect(warningBox).toHaveClass("opacity-95");
  });

  // ------ Test 6️⃣ -------
  it("calls setShowWarning(false) when input select is clicked", () => {
    render(
      <LanguageSelector
        inputLang="en"
        outputLang="fr"
        setInputLang={setInputLang}
        setOutputLang={setOutputLang}
        isSwitching={false}
        switchLanguage={switchLanguage}
        showWarning={true}
        setShowWarning={setShowWarning}
      />
    );

    const inputSelect = screen.getByTestId("input-lang-select");
    fireEvent.click(inputSelect);

    expect(setShowWarning).toHaveBeenCalledWith(false);
  });

  // ------ Test 7️⃣ -------
  it("applies switching classes when isSwitching is true", () => {
    render(
      <LanguageSelector
        inputLang="en"
        outputLang="fr"
        setInputLang={setInputLang}
        setOutputLang={setOutputLang}
        isSwitching={true}       // <-- triggers the "translate-x-full" branch
        switchLanguage={switchLanguage}
        showWarning={false}
        setShowWarning={setShowWarning}
      />
    );

    const inputSelect = screen.getByTestId("input-lang-select");
    const outputSelect = screen.getByTestId("output-lang-select");

    expect(inputSelect).toHaveClass("translate-x-full");
    expect(outputSelect).toHaveClass("-translate-x-full");
  });

  // ------ Test 8️⃣ -------
  it("renders code fallback when ISO6391.getName returns empty", () => {
    // Override getAllCodes and getName for this test
    const spyGetAllCodes = jest.spyOn(ISO6391, "getAllCodes").mockReturnValue(["en", "xx"] as unknown as LanguageCode[]);
    const spyGetName = jest.spyOn(ISO6391, "getName").mockImplementation(code => {
      if (code === "xx") return ""; // simulate missing name
      const names: Record<string, string> = { en: "English", fr: "French", es: "Spanish" };
      return names[code] || code;
    });

    render(
      <LanguageSelector
        inputLang="en"
        outputLang="xx"
        setInputLang={setInputLang}
        setOutputLang={setOutputLang}
        isSwitching={false}
        switchLanguage={switchLanguage}
        showWarning={false}
        setShowWarning={setShowWarning}
      />
    );

    // The known language should render normally
    expect(within(screen.getByTestId("input-lang-select")).getByText("English")).toBeInTheDocument();
    // The unknown language should fall back to code display
    expect(within(screen.getByTestId("output-lang-select")).getByText("xx")).toBeInTheDocument();

    // Restore original implementations
    spyGetAllCodes.mockRestore();
    spyGetName.mockRestore();
  });
});

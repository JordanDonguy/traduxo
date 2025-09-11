/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import React, { ReactNode } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { AppProviderBase, useApp } from "@traduxo/packages/contexts/AppContext";

// ---- Mocks for nested providers ----
jest.mock("@traduxo/packages/contexts/TranslationContext", () => ({
  TranslationProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

jest.mock("@traduxo/packages/contexts/LanguageContext", () => ({
  LanguageProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

jest.mock("@traduxo/packages/contexts/AuthContext", () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

// ---- Helper render function ----
const renderWithProvider = (ui: ReactNode) =>
  render(<AppProviderBase>{ui}</AppProviderBase>);

// ---- Test component to access context ----
const TestComponent = () => {
  const { showLoginForm, setShowLoginForm, error, setError, isLoading, setIsLoading } = useApp();
  return (
    <div>
      <span data-testid="login-form">{showLoginForm ? "true" : "false"}</span>
      <span data-testid="error">{error}</span>
      <span data-testid="loading">{isLoading ? "true" : "false"}</span>
      <button onClick={() => setShowLoginForm(true)}>Open Login</button>
      <button onClick={() => setError("Error occurred")}>Set Error</button>
      <button onClick={() => setIsLoading(true)}>Set Loading</button>
    </div>
  );
};

// ---- Tests ----
describe("AppProviderBase", () => {
  // ------ Test 1️⃣ ------
  it("throws if useApp is used outside AppProviderBase", () => {
    const OutsideComponent = () => {
      useApp();
      return null;
    };
    expect(() => render(<OutsideComponent />)).toThrow(
      "useApp must be used within AppProvider"
    );
  });

  // ------ Test 2️⃣ ------
  it("provides default state inside provider", () => {
    renderWithProvider(<TestComponent />);

    expect(screen.getByTestId("login-form")).toHaveTextContent("false");
    expect(screen.getByTestId("error")).toHaveTextContent("");
    expect(screen.getByTestId("loading")).toHaveTextContent("false");
  });

  // ------ Test 3️⃣ ------
  it("allows updating state via setters", () => {
    renderWithProvider(<TestComponent />);

    fireEvent.click(screen.getByText("Open Login"));
    fireEvent.click(screen.getByText("Set Error"));
    fireEvent.click(screen.getByText("Set Loading"));

    expect(screen.getByTestId("login-form")).toHaveTextContent("true");
    expect(screen.getByTestId("error")).toHaveTextContent("Error occurred");
    expect(screen.getByTestId("loading")).toHaveTextContent("true");
  });

  // ------ Test 4️⃣ ------
  it("renders children", () => {
    renderWithProvider(<div>Child Component</div>);
    expect(screen.getByText("Child Component")).toBeInTheDocument();
  });
});

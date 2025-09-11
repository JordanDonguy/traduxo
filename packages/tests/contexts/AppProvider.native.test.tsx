/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import React, { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import AppProvider from "@traduxo/packages/contexts/AppProvider.native";

// ---- Mocks ----
jest.mock("@traduxo/packages/contexts/AppContext", () => ({
  AppProviderBase: ({ children }: { children: ReactNode }) => <div data-testid="app-provider-base">{children}</div>,
}));

// ---- Helper Wrappers ----
const renderWithProvider = (ui: ReactNode) => render(<AppProvider>{ui}</AppProvider>);

// ---- Tests ----
describe("AppProvider (React Native)", () => {
  // ------ Test 1️⃣ ------
  it("renders children inside AppProviderBase", () => {
    renderWithProvider(<div>Child Component</div>);
    expect(screen.getByText("Child Component")).toBeInTheDocument();
    expect(screen.getByTestId("app-provider-base")).toBeInTheDocument();
  });

  // ------ Test 2️⃣ ------
  it("renders AppProviderBase wrapper", () => {
    renderWithProvider(<div>Test</div>);
    expect(screen.getByTestId("app-provider-base")).toBeInTheDocument();
  });
});

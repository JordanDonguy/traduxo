/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import React, { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import AppProvider from "@/contexts/AppProvider.web";

// ---- Mocks ----
jest.mock("react-toastify", () => ({
  ToastContainer: () => <div data-testid="toast-container" />,
}));

jest.mock("next-themes", () => ({
  ThemeProvider: ({ children }: { children: ReactNode }) => <div data-testid="theme-provider">{children}</div>,
}));

jest.mock("@traduxo/packages/contexts/AppContext", () => ({
  AppProviderBase: ({ children }: { children: ReactNode }) => <div data-testid="app-provider-base">{children}</div>,
}));

// ---- Helper ----
const renderWithProvider = (ui: ReactNode) => render(<AppProvider>{ui}</AppProvider>);

// ---- Tests ----
describe("AppProvider", () => {
  // ------ Test 1️⃣ ------
  it("renders children", () => {
    renderWithProvider(<div>Child Component</div>);
    expect(screen.getByText("Child Component")).toBeInTheDocument();
  });

  // ------ Test 2️⃣ ------
  it("renders ToastContainer and ThemeProvider wrappers", () => {
    renderWithProvider(<div>Child Component</div>);
    expect(screen.getByTestId("toast-container")).toBeInTheDocument();
    expect(screen.getByTestId("theme-provider")).toBeInTheDocument();
    expect(screen.getByTestId("app-provider-base")).toBeInTheDocument();
  });
});

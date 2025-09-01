/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import React, { ReactNode } from "react";
import { renderHook, act } from "@testing-library/react";
import { render } from "@testing-library/react";
import AppProvider, { useApp } from "@/context/AppContext";

// ---- Mocks ----
jest.mock("react-toastify", () => ({
  ToastContainer: () => <div />,
}));

jest.mock("next-themes", () => ({
  ThemeProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

jest.mock("next-auth/react", () => ({
  SessionProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

jest.mock("@/context/TranslationContext", () => ({
  TranslationProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

jest.mock("@/context/LanguageContext", () => ({
  LanguageProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

// ---- Helper Wrappers ----
const wrapper = ({ children }: { children: ReactNode }) => (
  <AppProvider>{children}</AppProvider>
);

const renderWithProvider = (ui: ReactNode) => render(<AppProvider>{ui}</AppProvider>);

// ---- Tests ----
describe("AppContext", () => {
  it("throws if useApp is used outside AppProvider", () => {
    expect(() => renderHook(() => useApp())).toThrow(
      "useApp must be used within AppProvider"
    );
  });

  it("provides default state inside AppProvider", () => {
    const { result } = renderHook(() => useApp(), { wrapper });

    expect(result.current.showLoginForm).toBe(false);
    expect(result.current.error).toBe("");
    expect(result.current.isLoading).toBe(false);
  });

  it("allows updating state via setters", () => {
    const { result } = renderHook(() => useApp(), { wrapper });

    act(() => {
      result.current.setShowLoginForm(true);
      result.current.setError("Error occurred");
      result.current.setIsLoading(true);
    });

    expect(result.current.showLoginForm).toBe(true);
    expect(result.current.error).toBe("Error occurred");
    expect(result.current.isLoading).toBe(true);
  });

  it("renders children", () => {
    const { getByText } = renderWithProvider(<div>Child Component</div>);
    expect(getByText("Child Component")).toBeInTheDocument();
  });
});

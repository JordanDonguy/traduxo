/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import Logo from "@/components/Logo";

// Mock next-themes
jest.mock("next-themes", () => ({
  useTheme: jest.fn(),
}));

import { useTheme } from "next-themes";

describe("Logo component", () => {
  const mockThemeReturn = (resolvedTheme: string) => ({
    resolvedTheme,
    theme: resolvedTheme,
    setTheme: jest.fn(),
    themes: ["light", "dark"],
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ------ Test 1️⃣ -------
  it("renders SVG with correct strokeWidth in light theme", () => {
    (useTheme as jest.Mock).mockReturnValue(mockThemeReturn("light"));

    render(<Logo />);
    const svgPath = document.querySelector("svg path");
    expect(svgPath).toBeInTheDocument();
    expect(svgPath).toHaveAttribute("stroke-width", "0.7");
  });

  // ------ Test 2️⃣ -------
  it("renders SVG with correct strokeWidth in dark theme", () => {
    (useTheme as jest.Mock).mockReturnValue(mockThemeReturn("dark"));

    render(<Logo />);
    const svgPath = document.querySelector("svg path");
    expect(svgPath).toBeInTheDocument();
    expect(svgPath).toHaveAttribute("stroke-width", "0.2");
  });
});

/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import LoadingAnimation from "@/components/LoadingAnimation";

describe("LoadingAnimation component", () => {
  it("renders three bouncing dots with proper classes", () => {
    render(<LoadingAnimation />);

    // Select all spans with class "dot"
    const dots = document.querySelectorAll(".dot");
    expect(dots).toHaveLength(3);

    // Check classes for each dot
    expect(dots[0]).toHaveClass("dot");
    expect(dots[0]).not.toHaveClass("delay-150");
    expect(dots[0]).not.toHaveClass("delay-300");

    expect(dots[1]).toHaveClass("dot", "delay-150");
    expect(dots[2]).toHaveClass("dot", "delay-300");
  });
});
